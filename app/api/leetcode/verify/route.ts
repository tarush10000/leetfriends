import { NextRequest, NextResponse } from "next/server";

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
                            username
                            profile {
                                realName
                                ranking
                            }
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
        
        if (!data.data?.matchedUser) {
            return null;
        }

        const user = data.data.matchedUser;
        const stats = user.submitStats?.acSubmissionNum || [];
        
        const easy = stats.find((s: any) => s.difficulty === "Easy")?.count || 0;
        const medium = stats.find((s: any) => s.difficulty === "Medium")?.count || 0;
        const hard = stats.find((s: any) => s.difficulty === "Hard")?.count || 0;

        return {
            username: user.username,
            realName: user.profile?.realName,
            ranking: user.profile?.ranking,
            stats: {
                easy,
                medium,
                hard,
                total: easy + medium + hard,
            }
        };
    } catch (error) {
        console.error(`Error fetching LeetCode data for ${username}:`, error);
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const { username } = await req.json();

        if (!username) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }

        const userData = await fetchLeetCodeStats(username.trim());
        
        if (!userData) {
            return NextResponse.json({ 
                error: "LeetCode user not found or profile is private",
                valid: false 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            valid: true,
            stats: userData.stats,
            profile: {
                username: userData.username,
                realName: userData.realName,
                ranking: userData.ranking,
            }
        });

    } catch (error) {
        console.error("LeetCode verification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}