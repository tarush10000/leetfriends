import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// This should be called by a cron service (like Vercel Cron or external service)
// Add this to your vercel.json:
// {
//   "crons": [
//     {
//       "path": "/api/cron/update-stats",
//       "schedule": "0 */6 * * *"
//     }
//   ]
// }

const LEETCODE_API_URL = "https://leetcode.com/graphql";

async function fetchLeetCodeStats(username: string) {
    try {
        const response = await fetch(LEETCODE_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            body: JSON.stringify({
                query: `
                    query getUserProfile($username: String!) {
                        matchedUser(username: $username) {
                            submitStats {
                                acSubmissionNum {
                                    difficulty
                                    count
                                }
                            }
                        }
                    }
                `,
                variables: { username }
            }),
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (!data.data?.matchedUser?.submitStats?.acSubmissionNum) return null;

        const stats = data.data.matchedUser.submitStats.acSubmissionNum;
        const easy = stats.find((s: any) => s.difficulty === "Easy")?.count || 0;
        const medium = stats.find((s: any) => s.difficulty === "Medium")?.count || 0;
        const hard = stats.find((s: any) => s.difficulty === "Hard")?.count || 0;

        return {
            easy,
            medium,
            hard,
            total: easy + medium + hard,
        };
    } catch (error) {
        console.error(`Error fetching stats for ${username}:`, error);
        return null;
    }
}

export async function GET(req: NextRequest) {
    try {
        // Verify this is a legitimate cron request
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = await connectToDatabase();
        const parties = db.collection("parties");

        // Get all parties
        const allParties = await parties.find({}).toArray();
        
        let totalUpdated = 0;
        let totalMembers = 0;

        for (const party of allParties) {
            console.log(`Updating stats for party: ${party.name} (${party.code})`);
            
            for (const member of party.members) {
                totalMembers++;
                const stats = await fetchLeetCodeStats(member.leetcodeUsername);
                
                if (stats) {
                    await parties.updateOne(
                        { 
                            code: party.code, 
                            "members.email": member.email 
                        },
                        {
                            $set: {
                                "members.$.stats": {
                                    ...stats,
                                    lastUpdated: new Date(),
                                },
                            },
                        }
                    );
                    totalUpdated++;
                }

                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`Cron job completed: Updated ${totalUpdated}/${totalMembers} members`);

        return NextResponse.json({ 
            success: true, 
            message: `Updated ${totalUpdated}/${totalMembers} members across ${allParties.length} parties`,
            totalParties: allParties.length,
            totalMembers,
            totalUpdated
        });

    } catch (error) {
        console.error("Cron job error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}