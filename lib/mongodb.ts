import { MongoClient, MongoClientOptions } from "mongodb";

declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI!;

if (!uri) {
    throw new Error('Please add your MongoDB URI to .env.local');
}

// MongoDB connection options with SSL fixes
const options: MongoClientOptions = {
    // SSL/TLS Configuration
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,

    // Connection settings
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,

    // Retry settings
    retryWrites: true,
    retryReads: true,

    // Additional options for stability
    heartbeatFrequencyMS: 10000,
    maxIdleTimeMS: 30000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable to preserve the value
    // across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export default clientPromise;

export async function connectToDatabase() {
    try {
        const client = await clientPromise;
        return client.db("leetcode_leaderboard");
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}