import fetch from "node-fetch";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

const usernames = ["tarush10000", "anotherFriend"];

const fetchStats = async (username: string) => {
    const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            query: `query getUserProfile { matchedUser(username: \"${username}\") { submitStats { acSubmissionNum { difficulty count } } } }`
        })
    });
    const json = await res.json() as {
        data: {
            matchedUser: {
                submitStats: {
                    acSubmissionNum: { difficulty: string; count: number }[]
                }
            }
        }
    };
    const stats = json.data.matchedUser.submitStats.acSubmissionNum;
    const easy = stats.find((s: any) => s.difficulty === "Easy")?.count || 0;
    const medium = stats.find((s: any) => s.difficulty === "Medium")?.count || 0;
    const hard = stats.find((s: any) => s.difficulty === "Hard")?.count || 0;
    return { username, easy, medium, hard, total: easy + medium + hard, lastUpdated: new Date().toISOString() };
};

(async () => {
    await client.connect();
    const db = client.db("leetcode_leaderboard");
    for (const username of usernames) {
        const stats = await fetchStats(username);
        await db.collection("users").updateOne({ username }, { $set: stats }, { upsert: true });
    }
    await client.close();
})();