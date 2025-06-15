import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

const ACHIEVEMENT_DEFINITIONS = [
    // Streak Achievements
    {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Solve problems for 7 consecutive days',
        icon: 'flame',
        category: 'streak',
        tier: 'bronze',
        requirement: 7,
        rarity: 'common',
        xpReward: 100
    },
    {
        id: 'streak_30',
        name: 'Monthly Master',
        description: 'Solve problems for 30 consecutive days',
        icon: 'flame',
        category: 'streak',
        tier: 'gold',
        requirement: 30,
        rarity: 'rare',
        xpReward: 500
    },
    {
        id: 'streak_100',
        name: 'Century Solver',
        description: 'Solve problems for 100 consecutive days',
        icon: 'crown',
        category: 'streak',
        tier: 'diamond',
        requirement: 100,
        rarity: 'legendary',
        xpReward: 2000
    },
    
    // Difficulty Mastery
    {
        id: 'easy_master_50',
        name: 'Easy Enthusiast',
        description: 'Solve 50 easy problems',
        icon: 'target',
        category: 'difficulty',
        tier: 'bronze',
        requirement: 50,
        rarity: 'common',
        xpReward: 150
    },
    {
        id: 'medium_master_50',
        name: 'Medium Maverick',
        description: 'Solve 50 medium problems',
        icon: 'target',
        category: 'difficulty',
        tier: 'silver',
        requirement: 50,
        rarity: 'rare',
        xpReward: 300
    },
    {
        id: 'hard_master_25',
        name: 'Hard Hero',
        description: 'Solve 25 hard problems',
        icon: 'crown',
        category: 'difficulty',
        tier: 'gold',
        requirement: 25,
        rarity: 'epic',
        xpReward: 750
    },
    
    // Social Achievements
    {
        id: 'party_creator',
        name: 'Party Starter',
        description: 'Create your first coding party',
        icon: 'users',
        category: 'social',
        tier: 'bronze',
        requirement: 1,
        rarity: 'common',
        xpReward: 50
    },
    {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Join 5 different parties',
        icon: 'users',
        category: 'social',
        tier: 'silver',
        requirement: 5,
        rarity: 'rare',
        xpReward: 200
    },
    
    // Milestone Achievements
    {
        id: 'century_club',
        name: 'Century Club',
        description: 'Solve 100 total problems',
        icon: 'trophy',
        category: 'milestone',
        tier: 'silver',
        requirement: 100,
        rarity: 'rare',
        xpReward: 400
    },
    {
        id: 'problem_solver_500',
        name: 'Problem Crusher',
        description: 'Solve 500 total problems',
        icon: 'crown',
        category: 'milestone',
        tier: 'platinum',
        requirement: 500,
        rarity: 'epic',
        xpReward: 1500
    }
];

const LEETCODE_API_URL = "https://leetcode.com/graphql";

// Direct LeetCode streak calculation (no internal API calls)
async function calculateLeetCodeStreak(leetcodeUsername: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastSubmissionDate: string | null;
} | null> {
    try {
        // Fetch submission history from LeetCode
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
                    username: leetcodeUsername,
                    limit: 1000
                }
            }),
        });

        if (!response.ok) {
            console.error(`LeetCode API error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        
        if (!data.data?.recentAcSubmissionList) {
            console.log(`No submissions found for ${leetcodeUsername}`);
            return {
                currentStreak: 0,
                longestStreak: 0,
                lastSubmissionDate: null
            };
        }

        const submissions = data.data.recentAcSubmissionList;
        
        // Convert timestamps to dates and group by day
        const submissionDates = submissions
            .map((sub: any) => {
                const date = new Date(parseInt(sub.timestamp) * 1000);
                return date.toISOString().split('T')[0]; // YYYY-MM-DD format
            })
            .filter((date: string, index: number, array: string[]) => array.indexOf(date) === index) // Remove duplicates
            .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime()); // Sort descending

        if (submissionDates.length === 0) {
            return {
                currentStreak: 0,
                longestStreak: 0,
                lastSubmissionDate: null
            };
        }

        // Calculate current streak
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

    } catch (error) {
        console.error('Error calculating LeetCode streak:', error);
        return null;
    }
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ userEmail: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userEmail } = await params;
        
        // Verify user can access this data
        if (session.user.email !== decodeURIComponent(userEmail)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const db = await connectToDatabase();
        const users = db.collection("users");
        const parties = db.collection("parties");

        // Get user data
        const user = await users.findOne({ email: userEmail });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get user's party statistics
        const userParties = await parties.find({ 
            "members.email": userEmail 
        }).toArray();

        const partiesCreated = await parties.countDocuments({ 
            createdBy: userEmail 
        });

        // Get cached streak data or calculate new one
        let streakData = user.cachedStreakData;
        const cacheAge = streakData?.calculatedAt ? 
            Date.now() - new Date(streakData.calculatedAt).getTime() : 
            Infinity;

        // Refresh streak data if cache is older than 1 hour or doesn't exist
        if (!streakData || cacheAge > 60 * 60 * 1000) {
            if (user.leetcodeUsername) {
                const freshStreakData = await calculateLeetCodeStreak(user.leetcodeUsername);
                if (freshStreakData) {
                    streakData = freshStreakData;
                    
                    // Cache the streak data in user document
                    await users.updateOne(
                        { email: userEmail },
                        { 
                            $set: { 
                                cachedStreakData: {
                                    ...streakData,
                                    calculatedAt: new Date().toISOString()
                                },
                                lastStreakUpdate: new Date()
                            } 
                        }
                    );
                } else {
                    // Fallback to default values if calculation fails
                    streakData = {
                        currentStreak: 0,
                        longestStreak: 0,
                        lastSubmissionDate: null
                    };
                }
            } else {
                streakData = {
                    currentStreak: 0,
                    longestStreak: 0,
                    lastSubmissionDate: null
                };
            }
        }

        // Calculate current progress for each achievement
        const achievements = ACHIEVEMENT_DEFINITIONS.map(def => {
            let currentProgress = 0;

            switch (def.id) {
                case 'streak_7':
                case 'streak_30':
                case 'streak_100':
                    currentProgress = streakData?.currentStreak || 0;
                    break;
                case 'easy_master_50':
                    currentProgress = user.currentStats?.easy || 0;
                    break;
                case 'medium_master_50':
                    currentProgress = user.currentStats?.medium || 0;
                    break;
                case 'hard_master_25':
                    currentProgress = user.currentStats?.hard || 0;
                    break;
                case 'party_creator':
                    currentProgress = partiesCreated;
                    break;
                case 'social_butterfly':
                    currentProgress = userParties.length;
                    break;
                case 'century_club':
                case 'problem_solver_500':
                    currentProgress = user.currentStats?.total || 0;
                    break;
                default:
                    currentProgress = 0;
            }

            const isUnlocked = currentProgress >= def.requirement;

            return {
                ...def,
                currentProgress: Math.min(currentProgress, def.requirement),
                isUnlocked,
                unlockedAt: isUnlocked ? new Date().toISOString() : undefined
            };
        });

        // Calculate total XP and level
        const totalXP = achievements
            .filter(a => a.isUnlocked)
            .reduce((sum, a) => sum + a.xpReward, 0);
        
        const level = Math.floor(totalXP / 1000) + 1;
        const nextLevelXP = level * 1000;

        const stats = {
            totalProblems: user.currentStats?.total || 0,
            easyProblems: user.currentStats?.easy || 0,
            mediumProblems: user.currentStats?.medium || 0,
            hardProblems: user.currentStats?.hard || 0,
            partiesJoined: userParties.length,
            partiesCreated
        };

        return NextResponse.json({
            achievements,
            totalXP,
            level,
            nextLevelXP,
            streakData: {
                currentStreak: streakData?.currentStreak || 0,
                longestStreak: streakData?.longestStreak || 0,
                lastSubmissionDate: streakData?.lastSubmissionDate,
                lastUpdated: user.lastStreakUpdate?.toISOString() || null,
                cacheAge: Math.floor(cacheAge / 1000) // in seconds
            },
            stats
        });

    } catch (error) {
        console.error("Achievements error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST endpoint to manually refresh streak data
export async function POST(req: NextRequest, { params }: { params: Promise<{ userEmail: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userEmail } = await params;
        
        // Verify user can refresh their own data
        if (session.user.email !== decodeURIComponent(userEmail)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const db = await connectToDatabase();
        const users = db.collection("users");

        const user = await users.findOne({ email: userEmail });
        if (!user || !user.leetcodeUsername) {
            return NextResponse.json({ error: "User or LeetCode username not found" }, { status: 404 });
        }

        // Force refresh streak data
        const freshStreakData = await calculateLeetCodeStreak(user.leetcodeUsername);
        
        if (!freshStreakData) {
            return NextResponse.json({ error: "Failed to calculate streak from LeetCode" }, { status: 500 });
        }

        // Update cached data
        await users.updateOne(
            { email: userEmail },
            { 
                $set: { 
                    cachedStreakData: {
                        ...freshStreakData,
                        calculatedAt: new Date().toISOString()
                    },
                    lastStreakUpdate: new Date()
                } 
            }
        );

        return NextResponse.json({
            success: true,
            message: "Streak data refreshed successfully",
            streakData: freshStreakData
        });

    } catch (error) {
        console.error("Streak refresh error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}