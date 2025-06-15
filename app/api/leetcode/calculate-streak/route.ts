// /api/leetcode/calculate-streak/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const LEETCODE_API_URL = "https://leetcode.com/graphql";

interface SubmissionData {
    timestamp: string;
    statusDisplay: string;
    question: {
        title: string;
        titleSlug: string;
    };
}

async function fetchLeetCodeSubmissions(username: string): Promise<SubmissionData[]> {
    try {
        const response = await fetch(LEETCODE_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            body: JSON.stringify({
                query: `
                    query recentAcSubmissions($username: String!, $limit: Int!) {
                        recentAcSubmissionList(username: $username, limit: $limit) {
                            id
                            title
                            titleSlug
                            timestamp
                        }
                    }
                `,
                variables: {
                    username,
                    limit: 1000 // Get last 1000 accepted submissions
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.data?.recentAcSubmissionList) {
            return [];
        }

        return data.data.recentAcSubmissionList.map((sub: any) => ({
            timestamp: sub.timestamp,
            statusDisplay: "Accepted",
            question: {
                title: sub.title,
                titleSlug: sub.titleSlug
            }
        }));

    } catch (error) {
        console.error(`Error fetching LeetCode submissions for ${username}:`, error);

        // Fallback: Try alternative API approach
        try {
            const fallbackResponse = await fetch(LEETCODE_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
                body: JSON.stringify({
                    query: `
                        query userProfileUserQuestionProgressV2($userSlug: String!) {
                            userProfileUserQuestionProgressV2(userSlug: $userSlug) {
                                numAcceptedQuestions {
                                    difficulty
                                    count
                                }
                            }
                        }
                    `,
                    variables: { userSlug: username }
                }),
            });

            if (fallbackResponse.ok) {
                // If we can't get submission history, return empty array
                // The streak will be calculated as 0
                return [];
            }
        } catch (fallbackError) {
            console.error("Fallback API also failed:", fallbackError);
        }

        return [];
    }
}

function calculateStreakFromSubmissions(submissions: SubmissionData[]): {
    currentStreak: number;
    longestStreak: number;
    lastSubmissionDate: string | null;
} {
    if (submissions.length === 0) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            lastSubmissionDate: null
        };
    }

    // Convert timestamps to dates and group by day
    const submissionDates = submissions
        .map(sub => {
            const date = new Date(parseInt(sub.timestamp) * 1000);
            return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        })
        .filter((date, index, array) => array.indexOf(date) === index) // Remove duplicates
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Sort descending (newest first)

    if (submissionDates.length === 0) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            lastSubmissionDate: null
        };
    }

    // Calculate current streak (from today/yesterday backwards)
    let currentStreak = 0;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Start from today or yesterday (grace period)
    let startDate: Date;
    if (submissionDates.includes(todayStr)) {
        startDate = today;
    } else if (submissionDates.includes(yesterdayStr)) {
        startDate = yesterday;
    } else {
        // No recent activity, streak is 0
        return {
            currentStreak: 0,
            longestStreak: calculateLongestStreak(submissionDates),
            lastSubmissionDate: submissionDates[0]
        };
    }

    // Count consecutive days backwards from start date
    const checkDate = new Date(startDate);
    for (let i = 0; i < submissionDates.length; i++) {
        const checkDateStr = checkDate.toISOString().split('T')[0];

        if (submissionDates.includes(checkDateStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    const longestStreak = Math.max(currentStreak, calculateLongestStreak(submissionDates));

    return {
        currentStreak,
        longestStreak,
        lastSubmissionDate: submissionDates[0]
    };
}

function calculateLongestStreak(sortedDates: string[]): number {
    if (sortedDates.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;

    // Sort in ascending order for this calculation
    const ascendingDates = [...sortedDates].sort();

    for (let i = 1; i < ascendingDates.length; i++) {
        const prevDate = new Date(ascendingDates[i - 1]);
        const currDate = new Date(ascendingDates[i]);

        const dayDiff = Math.floor(
            (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (dayDiff === 1) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            currentStreak = 1;
        }
    }

    return longestStreak;
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { username } = await req.json();

        if (!username) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }

        console.log(`Calculating streak for LeetCode user: ${username}`);

        // Fetch submission history from LeetCode
        const submissions = await fetchLeetCodeSubmissions(username);

        console.log(`Found ${submissions.length} submissions for ${username}`);

        // Calculate streaks
        const streakData = calculateStreakFromSubmissions(submissions);

        console.log(`Calculated streaks for ${username}:`, streakData);

        return NextResponse.json({
            success: true,
            streakData: {
                currentStreak: streakData.currentStreak,
                longestStreak: streakData.longestStreak,
                lastSubmissionDate: streakData.lastSubmissionDate,
                totalSubmissions: submissions.length,
                calculatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("Error calculating LeetCode streak:", error);
        return NextResponse.json({
            error: "Failed to calculate streak",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}