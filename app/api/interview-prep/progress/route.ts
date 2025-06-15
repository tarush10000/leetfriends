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

export async function GET(req: NextRequest, { params }: { params: { userEmail: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userEmail } = params;
        
        // Verify user can access this data
        if (session.user.email !== decodeURIComponent(userEmail)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const db = await connectToDatabase();
        const users = db.collection("users");
        const parties = db.collection("parties");
        const dailyActivities = db.collection("daily_activities");

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

        // Calculate actual streak
        const currentStreak = await calculateCurrentStreak(dailyActivities, userEmail);

        // Calculate current progress for each achievement
        const achievements = ACHIEVEMENT_DEFINITIONS.map(def => {
            let currentProgress = 0;

            switch (def.id) {
                case 'streak_7':
                case 'streak_30':
                case 'streak_100':
                    currentProgress = currentStreak;
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

        // Get actual streak data
        const longestStreak = await calculateLongestStreak(dailyActivities, userEmail);
        const lastActivity = await dailyActivities
            .findOne(
                { userId: userEmail, problemsSolved: { $gt: 0 } },
                { sort: { date: -1 } }
            );

        const streakData = {
            currentStreak,
            longestStreak: Math.max(currentStreak, longestStreak),
            lastSolvedDate: lastActivity?.date ? 
                new Date(lastActivity.date + 'T12:00:00Z').toISOString() : 
                user.lastActive?.toISOString() || new Date().toISOString()
        };

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
            streakData,
            stats
        });

    } catch (error) {
        console.error("Achievements error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// FIXED: Proper streak calculation instead of Math.random()
async function calculateCurrentStreak(dailyActivities: any, userEmail: string): Promise<number> {
    try {
        // Get the last 365 days of activity, sorted by date descending
        const activities = await dailyActivities
            .find({ 
                userId: userEmail,
                problemsSolved: { $gt: 0 } // Only count days with actual activity
            })
            .sort({ date: -1 })
            .limit(365)
            .toArray();

        if (activities.length === 0) {
            return 0;
        }

        let streak = 0;
        const today = new Date();
        let checkDate = new Date(today);
        
        // Allow grace period - if no activity today, start from yesterday
        const todayStr = formatDate(today);
        const hasActivityToday = activities.some((a: any) => a.date === todayStr);
        
        if (!hasActivityToday) {
            checkDate.setDate(checkDate.getDate() - 1);
        }

        // Count consecutive days going backwards
        for (let i = 0; i < 365; i++) {
            const dateStr = formatDate(checkDate);
            const dayActivity = activities.find((a: any) => a.date === dateStr);
            
            if (dayActivity && dayActivity.problemsSolved > 0) {
                streak++;
            } else {
                break; // Streak is broken
            }
            
            checkDate.setDate(checkDate.getDate() - 1);
        }

        return streak;
    } catch (error) {
        console.error('Error calculating streak:', error);
        return 0;
    }
}

async function calculateLongestStreak(dailyActivities: any, userEmail: string): Promise<number> {
    try {
        const activities = await dailyActivities
            .find({ 
                userId: userEmail,
                problemsSolved: { $gt: 0 }
            })
            .sort({ date: 1 }) // Sort ascending for longest streak calculation
            .toArray();

        if (activities.length === 0) {
            return 0;
        }

        let longestStreak = 0;
        let currentStreak = 1;
        
        for (let i = 1; i < activities.length; i++) {
            const prevDate = new Date(activities[i - 1].date);
            const currDate = new Date(activities[i].date);
            
            // Check if dates are consecutive
            const dayDiff = Math.floor(
                (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            if (dayDiff === 1) {
                currentStreak++;
            } else {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1;
            }
        }
        
        return Math.max(longestStreak, currentStreak);
    } catch (error) {
        console.error('Error calculating longest streak:', error);
        return 0;
    }
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}