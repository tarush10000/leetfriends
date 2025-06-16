import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

const ACHIEVEMENT_DEFINITIONS = [
    // Streak Achievements
    {
        id: 'streak_3',
        name: 'Getting Started',
        description: 'Solve problems for 3 consecutive days',
        icon: 'flame',
        category: 'streak',
        tier: 'bronze',
        requirement: 3,
        rarity: 'common',
        xpReward: 50
    },
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
    {
        id: 'streak_365',
        name: 'Year Long Dedication',
        description: 'Solve problems for 365 consecutive days',
        icon: 'crown',
        category: 'streak',
        tier: 'mythic',
        requirement: 365,
        rarity: 'mythic',
        xpReward: 5000
    },

    // Difficulty Mastery
    {
        id: 'easy_master_10',
        name: 'Easy Starter',
        description: 'Solve 10 easy problems',
        icon: 'check-circle',
        category: 'difficulty',
        tier: 'bronze',
        requirement: 10,
        rarity: 'common',
        xpReward: 50
    },
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
        id: 'easy_master_100',
        name: 'Easy Expert',
        description: 'Solve 100 easy problems',
        icon: 'award',
        category: 'difficulty',
        tier: 'silver',
        requirement: 100,
        rarity: 'uncommon',
        xpReward: 250
    },
    {
        id: 'medium_master_10',
        name: 'Medium Beginner',
        description: 'Solve 10 medium problems',
        icon: 'target',
        category: 'difficulty',
        tier: 'bronze',
        requirement: 10,
        rarity: 'common',
        xpReward: 100
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
        id: 'medium_master_100',
        name: 'Medium Master',
        description: 'Solve 100 medium problems',
        icon: 'trophy',
        category: 'difficulty',
        tier: 'gold',
        requirement: 100,
        rarity: 'epic',
        xpReward: 600
    },
    {
        id: 'hard_master_5',
        name: 'Hard Starter',
        description: 'Solve 5 hard problems',
        icon: 'zap',
        category: 'difficulty',
        tier: 'silver',
        requirement: 5,
        rarity: 'uncommon',
        xpReward: 200
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
    {
        id: 'hard_master_50',
        name: 'Hard Legend',
        description: 'Solve 50 hard problems',
        icon: 'crown',
        category: 'difficulty',
        tier: 'diamond',
        requirement: 50,
        rarity: 'legendary',
        xpReward: 1200
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
        id: 'party_host',
        name: 'Party Host',
        description: 'Create 3 coding parties',
        icon: 'users',
        category: 'social',
        tier: 'silver',
        requirement: 3,
        rarity: 'uncommon',
        xpReward: 150
    },
    {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Join 5 different parties',
        icon: 'heart',
        category: 'social',
        tier: 'silver',
        requirement: 5,
        rarity: 'rare',
        xpReward: 200
    },
    {
        id: 'community_leader',
        name: 'Community Leader',
        description: 'Join 10 different parties',
        icon: 'star',
        category: 'social',
        tier: 'gold',
        requirement: 10,
        rarity: 'epic',
        xpReward: 400
    },

    // Milestone Achievements
    {
        id: 'first_solve',
        name: 'First Steps',
        description: 'Solve your first problem',
        icon: 'play',
        category: 'milestone',
        tier: 'bronze',
        requirement: 1,
        rarity: 'common',
        xpReward: 25
    },
    {
        id: 'dozen_problems',
        name: 'Baker\'s Dozen',
        description: 'Solve 12 total problems',
        icon: 'gift',
        category: 'milestone',
        tier: 'bronze',
        requirement: 12,
        rarity: 'common',
        xpReward: 75
    },
    {
        id: 'half_century',
        name: 'Half Century',
        description: 'Solve 50 total problems',
        icon: 'medal',
        category: 'milestone',
        tier: 'silver',
        requirement: 50,
        rarity: 'uncommon',
        xpReward: 200
    },
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
        id: 'triple_digits',
        name: 'Triple Digits',
        description: 'Solve 200 total problems',
        icon: 'award',
        category: 'milestone',
        tier: 'gold',
        requirement: 200,
        rarity: 'epic',
        xpReward: 600
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
    },
    {
        id: 'problem_solver_1000',
        name: 'Thousand Problems',
        description: 'Solve 1000 total problems',
        icon: 'crown',
        category: 'milestone',
        tier: 'diamond',
        requirement: 1000,
        rarity: 'legendary',
        xpReward: 3000
    },

    // Speed Achievements
    {
        id: 'speed_demon_daily',
        name: 'Speed Demon',
        description: 'Solve 5 problems in a single day',
        icon: 'zap',
        category: 'speed',
        tier: 'silver',
        requirement: 5,
        rarity: 'uncommon',
        xpReward: 150
    },
    {
        id: 'marathon_runner',
        name: 'Marathon Runner',
        description: 'Solve 10 problems in a single day',
        icon: 'zap',
        category: 'speed',
        tier: 'gold',
        requirement: 10,
        rarity: 'rare',
        xpReward: 300
    },
    {
        id: 'coding_machine',
        name: 'Coding Machine',
        description: 'Solve 20 problems in a single day',
        icon: 'cpu',
        category: 'speed',
        tier: 'platinum',
        requirement: 20,
        rarity: 'epic',
        xpReward: 600
    },

    // Special/Fun Achievements
    {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Solve a problem before 6 AM',
        icon: 'sunrise',
        category: 'special',
        tier: 'bronze',
        requirement: 1,
        rarity: 'uncommon',
        xpReward: 100
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Solve a problem after 11 PM',
        icon: 'moon',
        category: 'special',
        tier: 'bronze',
        requirement: 1,
        rarity: 'uncommon',
        xpReward: 100
    },
    {
        id: 'weekend_warrior',
        name: 'Weekend Warrior',
        description: 'Solve problems on both Saturday and Sunday',
        icon: 'calendar',
        category: 'special',
        tier: 'silver',
        requirement: 1,
        rarity: 'rare',
        xpReward: 150
    },
    {
        id: 'holiday_coder',
        name: 'Holiday Coder',
        description: 'Solve a problem on New Year\'s Day',
        icon: 'gift',
        category: 'special',
        tier: 'gold',
        requirement: 1,
        rarity: 'epic',
        xpReward: 250
    },
    {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Achieve 100% completion rate (solve all attempted problems)',
        icon: 'star',
        category: 'special',
        tier: 'platinum',
        requirement: 1,
        rarity: 'legendary',
        xpReward: 500
    },
    {
        id: 'comeback_kid',
        name: 'Comeback Kid',
        description: 'Return to coding after a 30+ day break',
        icon: 'arrow-up',
        category: 'special',
        tier: 'silver',
        requirement: 1,
        rarity: 'rare',
        xpReward: 200
    },
    {
        id: 'diversity_champion',
        name: 'Diversity Champion',
        description: 'Solve problems from 10 different topic categories',
        icon: 'globe',
        category: 'special',
        tier: 'gold',
        requirement: 10,
        rarity: 'epic',
        xpReward: 350
    },
    {
        id: 'mentor',
        name: 'Mentor',
        description: 'Help others by creating 5 coding parties',
        icon: 'heart',
        category: 'special',
        tier: 'platinum',
        requirement: 5,
        rarity: 'legendary',
        xpReward: 750
    },
    {
        id: 'leetcode_legend',
        name: 'LeetCode Legend',
        description: 'Reach the top 1% of LeetCode users',
        icon: 'crown',
        category: 'special',
        tier: 'mythic',
        requirement: 1,
        rarity: 'mythic',
        xpReward: 2500
    },
    {
        id: 'consistency_king',
        name: 'Consistency King',
        description: 'Solve at least 1 problem every day for 50 days',
        icon: 'calendar-check',
        category: 'special',
        tier: 'diamond',
        requirement: 50,
        rarity: 'legendary',
        xpReward: 1000
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
        // FIXED: Use const instead of let for checkDate
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
                case 'streak_3':
                case 'streak_7':
                case 'streak_30':
                case 'streak_100':
                case 'streak_365':
                case 'consistency_king':
                    currentProgress = streakData?.currentStreak || 0;
                    break;
                case 'easy_master_10':
                case 'easy_master_50':
                case 'easy_master_100':
                    currentProgress = user.currentStats?.easy || 0;
                    break;
                case 'medium_master_10':
                case 'medium_master_50':
                case 'medium_master_100':
                    currentProgress = user.currentStats?.medium || 0;
                    break;
                case 'hard_master_5':
                case 'hard_master_25':
                case 'hard_master_50':
                    currentProgress = user.currentStats?.hard || 0;
                    break;
                case 'party_creator':
                case 'mentor':
                    currentProgress = partiesCreated;
                    break;
                case 'party_host':
                    currentProgress = partiesCreated;
                    break;
                case 'social_butterfly':
                case 'community_leader':
                    currentProgress = userParties.length;
                    break;
                case 'first_solve':
                case 'dozen_problems':
                case 'half_century':
                case 'century_club':
                case 'triple_digits':
                case 'problem_solver_500':
                case 'problem_solver_1000':
                    currentProgress = user.currentStats?.total || 0;
                    break;
                // Special achievements that need custom logic
                case 'speed_demon_daily':
                case 'marathon_runner':
                case 'coding_machine':
                    // These would need daily submission tracking - placeholder for now
                    currentProgress = 0;
                    break;
                case 'early_bird':
                case 'night_owl':
                case 'weekend_warrior':
                case 'holiday_coder':
                case 'perfectionist':
                case 'comeback_kid':
                case 'diversity_champion':
                case 'leetcode_legend':
                    // These would need custom tracking logic - placeholder for now
                    currentProgress = 0;
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