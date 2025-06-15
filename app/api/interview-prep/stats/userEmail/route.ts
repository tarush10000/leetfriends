import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(req: NextRequest, { params }: { params: { userEmail: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userEmail } = params;
        const decodedEmail = decodeURIComponent(userEmail);

        if (session.user.email !== decodedEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const db = await connectToDatabase();
        const progress = db.collection("interview_progress");

        // Get completion stats by company
        const completionStats = await progress.aggregate([
            { $match: { userEmail: decodedEmail } },
            { $group: { 
                _id: "$company", 
                count: { $sum: 1 },
                lastCompleted: { $max: "$completedAt" }
            }},
            { $sort: { count: -1 } }
        ]).toArray();

        // Get difficulty breakdown
        const difficultyStats = await progress.aggregate([
            { $match: { userEmail: decodedEmail } },
            { $group: { 
                _id: "$difficulty", 
                count: { $sum: 1 }
            }}
        ]).toArray();

        // Get weekly progress (last 4 weeks)
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        const weeklyProgress = await progress.aggregate([
            { 
                $match: { 
                    userEmail: decodedEmail,
                    completedAt: { $gte: fourWeeksAgo }
                }
            },
            {
                $group: {
                    _id: {
                        week: { $week: "$completedAt" },
                        year: { $year: "$completedAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.week": 1 } }
        ]).toArray();

        const totalCompleted = await progress.countDocuments({ userEmail: decodedEmail });
        
        // Calculate streak
        const recentCompletions = await progress.find({ 
            userEmail: decodedEmail 
        }).sort({ completedAt: -1 }).limit(30).toArray();

        const currentStreak = calculateStreak(recentCompletions);

        return NextResponse.json({
            totalCompleted,
            currentStreak,
            completionsByCompany: completionStats,
            completionsByDifficulty: difficultyStats,
            weeklyProgress
        });

    } catch (error) {
        console.error("Stats fetch error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

function calculateStreak(completions: any[]): number {
    if (completions.length === 0) return 0;

    const dates = completions.map(c => {
        const date = new Date(c.completedAt);
        return date.toDateString();
    });

    const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    // Check if solved today or yesterday
    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
        streak = 1;
        
        // Count consecutive days
        for (let i = 1; i < uniqueDates.length; i++) {
            const currentDate = new Date(uniqueDates[i]);
            const previousDate = new Date(uniqueDates[i - 1]);
            const dayDiff = (previousDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000);
            
            if (dayDiff === 1) {
                streak++;
            } else {
                break;
            }
        }
    }

    return streak;
}