// app/api/leetcode/stats/route.ts - Enhanced with rate limiting
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { statsUpdateLimiter, RATE_LIMITS } from "@/lib/rateLimit";

// Existing fetchLeetCodeStats function (keep as is)
async function fetchLeetCodeStats(username: string) {
    try {
        const query = `
            query userProblemsSolved($username: String!) {
                allQuestionsCount {
                    difficulty
                    count
                }
                matchedUser(username: $username) {
                    problemsSolvedBeatsStats {
                        difficulty
                        percentage
                    }
                    submitStatsGlobal {
                        acSubmissionNum {
                            difficulty
                            count
                        }
                    }
                }
            }
        `;

        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com'
            },
            body: JSON.stringify({
                query,
                variables: { username }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.errors) {
            console.error('GraphQL errors for user', username, ':', data.errors);
            return null;
        }

        if (!data.data?.matchedUser) {
            console.error('User not found:', username);
            return null;
        }

        const stats = data.data.matchedUser.submitStatsGlobal.acSubmissionNum;
        const easy = stats.find((stat: any) => stat.difficulty === 'Easy')?.count || 0;
        const medium = stats.find((stat: any) => stat.difficulty === 'Medium')?.count || 0;
        const hard = stats.find((stat: any) => stat.difficulty === 'Hard')?.count || 0;

        return {
            easy,
            medium,
            hard,
            total: easy + medium + hard
        };

    } catch (error) {
        console.error(`Error fetching LeetCode stats for ${username}:`, error);
        return null;
    }
}

// Update individual user stats
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { username, partyCode } = await req.json();

        if (!username || !partyCode) {
            return NextResponse.json({ error: "Username and party code are required" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const parties = db.collection("parties");

        // Verify user is in the party
        const party = await parties.findOne({ 
            code: partyCode.toUpperCase(),
            "members.email": session.user.email
        });

        if (!party) {
            return NextResponse.json({ error: "Party not found or you're not a member" }, { status: 404 });
        }

        // Fetch new stats
        const stats = await fetchLeetCodeStats(username);
        if (!stats) {
            return NextResponse.json({ error: "Failed to fetch LeetCode stats. Please check your username." }, { status: 400 });
        }

        // Update user's stats in the party
        await parties.updateOne(
            {
                code: partyCode.toUpperCase(),
                "members.email": session.user.email
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

        return NextResponse.json({
            success: true,
            message: "Your stats have been updated!",
            stats
        });

    } catch (error) {
        console.error("Error updating individual LeetCode stats:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Update all party members' stats (Owner only with rate limiting)
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { partyCode } = await req.json();

        if (!partyCode) {
            return NextResponse.json({ error: "Party code is required" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const parties = db.collection("parties");

        // Get the party and verify ownership
        const party = await parties.findOne({ code: partyCode.toUpperCase() });
        if (!party) {
            return NextResponse.json({ error: "Party not found" }, { status: 404 });
        }

        // Check if user is the owner
        const member = party.members.find((m: any) => m.email === session.user?.email);
        if (!member || !member.isOwner) {
            return NextResponse.json({ error: "Only the party owner can update all stats" }, { status: 403 });
        }

        // Rate limiting check
        const rateLimitKey = `stats-update:${partyCode}`;
        const rateLimit = statsUpdateLimiter.checkLimit(
            rateLimitKey,
            RATE_LIMITS.STATS_UPDATE.maxRequests,
            RATE_LIMITS.STATS_UPDATE.windowMs
        );

        if (!rateLimit.allowed) {
            const waitTime = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
            return NextResponse.json({ 
                error: `Rate limit exceeded. Please wait ${waitTime} seconds before updating stats again.`,
                waitTime
            }, { status: 429 });
        }

        // Update each member's stats
        const updatePromises = party.members.map(async (member: any) => {
            const stats = await fetchLeetCodeStats(member.leetcodeUsername);
            if (stats) {
                await parties.updateOne(
                    {
                        code: partyCode.toUpperCase(),
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
            results,
            remainingRequests: rateLimit.remainingRequests,
            resetTime: rateLimit.resetTime
        });

    } catch (error) {
        console.error("Error updating party stats:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}