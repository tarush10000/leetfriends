import { MongoClient, MongoClientOptions } from "mongodb";

declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI!;

if (!uri) {
    throw new Error('Please add your MongoDB URI to .env.local');
}

// Debug logging
console.log('=== MongoDB Debug Info ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('URI exists:', !!uri);
console.log('URI format valid:', uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://'));

// Connection options with much longer timeouts
const options: MongoClientOptions = {
    // Increased timeouts for debugging
    serverSelectionTimeoutMS: 60000, // 60 seconds instead of 5
    connectTimeoutMS: 60000,         // 60 seconds
    socketTimeoutMS: 60000,          // 60 seconds
    
    // SSL/TLS Configuration
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
    
    // Basic settings
    maxPoolSize: 10,
    
    // Retry settings
    retryWrites: true,
    retryReads: true,
    
    // Additional options for stability
    heartbeatFrequencyMS: 10000,
    maxIdleTimeMS: 30000,
    
    // Force IPv4 (helps with some network issues)
    family: 4,
};

console.log('MongoDB connection options set');

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable to preserve the value
    // across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
        console.log('Creating new MongoDB client for development');
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    console.log('Creating new MongoDB client for production');
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export default clientPromise;

export async function connectToDatabase() {
    try {
        console.log('Attempting to connect to MongoDB...');
        const startTime = Date.now();
        
        const client = await clientPromise;
        
        const endTime = Date.now();
        console.log(`MongoDB connection successful in ${endTime - startTime}ms`);
        
        // Test the connection with a ping
        await client.db("admin").command({ ping: 1 });
        console.log('MongoDB ping successful');
        
        return client.db("leetcode_leaderboard");
    } catch (error) {
        console.error('=== MongoDB Connection Failed ===');
        console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        console.error('Error details:', error);
        
        // Provide specific guidance based on error type
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('ENOTFOUND')) {
            console.error('→ DNS resolution failed. Check your connection string hostname.');
        } else if (errorMessage.includes('authentication failed')) {
            console.error('→ Check your MongoDB username and password.');
        } else if (errorMessage.includes('Server selection timed out')) {
            console.error('→ Check MongoDB Atlas Network Access settings.');
        }
        
        throw error;
    }
}