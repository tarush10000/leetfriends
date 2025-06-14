import { MongoClient } from "mongodb";

declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI!;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
}

export default clientPromise = global._mongoClientPromise;

export async function connectToDatabase() {
    const client = await clientPromise;
    return client.db("leetcode_leaderboard");
}