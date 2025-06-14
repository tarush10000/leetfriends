// lib/mongodb-collections.ts
import { MongoClient, Db, Collection } from "mongodb";
import { Party, User } from "@/lib/types/mongodb";

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
    if (cachedDb) {
        return cachedDb;
    }
    
    await client.connect();
    const db = client.db("leetcode_leaderboard");
    cachedDb = db;
    return db;
}

export async function getPartyCollection(): Promise<Collection<Party>> {
    const db = await connectToDatabase();
    return db.collection<Party>("parties");
}

export async function getUserCollection(): Promise<Collection<User>> {
    const db = await connectToDatabase();
    return db.collection<User>("users");
}