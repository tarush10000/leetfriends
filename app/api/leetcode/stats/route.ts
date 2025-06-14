import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

// LeetCode GraphQL API endpoint
const LEETCODE_API_URL = "https://leetcode.com/graphql";

interface LeetCodeStats {
    easy: number;
    medium: number;
    hard: number;
    total: number;
}

async function fetchLeetCodeStats(username: string): Promise<LeetCodeStats | null> {
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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.data?.matchedUser?.submitStats?.acSubmissionNum) {
            return null;
        }

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
        console.error(`Error fetching LeetCode stats for ${username}:`, error);
        return null;
    }
}

// Update a single user's stats
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { username, partyCode } = await req.json();

        if (!username) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }

        // Fetch stats from LeetCode
        const stats = await fetchLeetCodeStats(username);
        if (!stats) {
            return NextResponse.json({ error: "Failed to fetch LeetCode stats. Please check the username." }, { status: 400 });
        }

        const db = await connectToDatabase();
        const parties = db.collection("parties");

        // Update stats in party if partyCode is provided
        if (partyCode) {
            await parties.updateOne(
                {
                    code: partyCode,
                    "members.email": session.user?.email
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
        }

        return NextResponse.json({
            success: true,
            stats,
            message: "Stats updated successfully!"
        });

    } catch (error) {
        console.error("Error updating LeetCode stats:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Update all party members' stats
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { partyCode } = await req.json();

        if (!partyCode) {
            return NextResponse.json({ error: "Party code is required" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const parties = db.collection("parties");

        // Get the party
        const party = await parties.findOne({ code: partyCode });
        if (!party) {
            return NextResponse.json({ error: "Party not found" }, { status: 404 });
        }

        // Update each member's stats
        const updatePromises = party.members.map(async (member: any) => {
            const stats = await fetchLeetCodeStats(member.leetcodeUsername);
            if (stats) {
                await parties.updateOne(
                    {
                        code: partyCode,
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
                return { email: member.email, username: member.leetcodeUsername, success: true, stats };
            }
            return { email: member.email, username: member.leetcodeUsername, success: false };
        });

        const results = await Promise.all(updatePromises);
        const successCount = results.filter(r => r.success).length;

        return NextResponse.json({
            success: true,
            message: `Updated ${successCount}/${results.length} members' stats`,
            results
        });

    } catch (error) {
        console.error("Error updating party stats:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}