import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { learningPathId, day, problemCompleted, problemNumber } = await req.json();

        const db = await connectToDatabase();
        const learningPaths = db.collection("learning_paths");
        const progressLog = db.collection("learning_progress");

        // Log the completed problem
        await progressLog.insertOne({
            userId: session.user.email,
            learningPathId,
            day,
            problemNumber,
            completedAt: new Date(),
            type: 'problem_completed'
        });

        // Update learning path progress
        const updateResult = await learningPaths.updateOne(
            { _id: learningPathId, userId: session.user.email },
            {
                $inc: { 'progress.problemsCompleted': 1 },
                $set: { 'progress.lastActivity': new Date() }
            }
        );

        // Check if day is completed
        const learningPath = await learningPaths.findOne({ _id: learningPathId });
        if (learningPath) {
            const currentDayData = learningPath.days.find((d: any) => d.day === day);
            const dayProblemsCompleted = await progressLog.countDocuments({
                userId: session.user.email,
                learningPathId,
                day
            });

            if (dayProblemsCompleted >= currentDayData.problemCount) {
                // Day completed, move to next day
                await learningPaths.updateOne(
                    { _id: learningPathId },
                    {
                        $inc: { 'progress.daysCompleted': 1 },
                        $set: { 'progress.currentDay': day + 1 }
                    }
                );

                return NextResponse.json({ 
                    success: true, 
                    dayCompleted: true,
                    nextDay: day + 1
                });
            }
        }

        return NextResponse.json({ success: true, dayCompleted: false });

    } catch (error) {
        console.error("Update progress error:", error);
        return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
    }
}
