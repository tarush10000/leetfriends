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
console.log('URI length:', uri.length);
// Don't log the full URI for security, just first/last parts
console.log('URI preview:', uri.substring(0, 20) + '...' + uri.substring(uri.length - 20));

// Connection options with more aggressive timeouts
const options: MongoClientOptions = {
    // Much longer timeouts for debugging
    serverSelectionTimeoutMS: 60000, // 60 seconds
    connectTimeoutMS: 60000,         // 60 seconds
    socketTimeoutMS: 60000,          // 60 seconds
    
    // Basic settings
    maxPoolSize: 5,
    minPoolSize: 1,
    
    // Retry settings
    retryWrites: true,
    retryReads: true,
    
    // Force IPv4 (sometimes helps with connectivity)
    family: 4,
};

console.log('MongoDB options:', JSON.stringify(options, null, 2));

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
        console.log('Creating new MongoDB client for development');
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    console.log('Creating new MongoDB client for production');
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export default clientPromise;

export async function connectToDatabase() {
    try {
        console.log('Starting MongoDB connection attempt...');
        const startTime = Date.now();
        
        const client = await clientPromise;
        
        const endTime = Date.now();
        console.log(`MongoDB connection successful in ${endTime - startTime}ms`);
        
        // Test the connection
        await client.db("admin").command({ ping: 1 });
        console.log('MongoDB ping successful');
        
        return client.db("leetcode_leaderboard");
    } catch (error) {
        console.error('=== MongoDB Connection Failed ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);
        
        // Check if it's a network/DNS issue
        if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
            console.error('This appears to be a network/DNS issue');
        }
        
        throw error;
    }
}