import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

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

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = await connectToDatabase();
        const users = db.collection("users");

        // Get user profile
        const userProfile = await users.findOne({ email: session.user?.email });
        if (!userProfile?.onboarded) {
            return NextResponse.json({ error: "User profile not found" }, { status: 404 });
        }

        // Fetch latest stats from LeetCode
        const stats = await fetchLeetCodeStats(userProfile.leetcodeUsername);
        if (!stats) {
            return NextResponse.json({ error: "Failed to fetch LeetCode stats" }, { status: 400 });
        }

        // Update user's current stats
        await users.updateOne(
            { email: session.user?.email },
            {
                $set: {
                    currentStats: {
                        ...stats,
                        lastUpdated: new Date(),
                    },
                    lastActive: new Date(),
                }
            }
        );

        return NextResponse.json({ 
            success: true, 
            stats,
            message: "Stats updated successfully!" 
        });

    } catch (error) {
        console.error("Error updating user stats:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}