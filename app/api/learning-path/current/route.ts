import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = await connectToDatabase();
        const learningPaths = db.collection("learning_paths");
        const progressLog = db.collection("learning_progress");

        // Get current active learning path
        const activePath = await learningPaths.findOne({
            userId: session.user.email,
            status: 'in_progress'
        });

        if (!activePath) {
            return NextResponse.json({ activePath: null });
        }

        // Get today's problems and completion status
        const currentDay = activePath.progress.currentDay;
        const todayData = activePath.days.find((d: any) => d.day === currentDay);

        if (todayData) {
            // Get completed problems for today
            const completedToday = await progressLog.find({
                userId: session.user.email,
                learningPathId: activePath._id,
                day: currentDay
            }).toArray();

            const completedProblemNumbers = completedToday.map(p => p.problemNumber);

            // Mark problems as completed
            todayData.problems = todayData.problems.map((problem: any) => ({
                ...problem,
                completed: completedProblemNumbers.includes(problem.number),
                completedAt: completedToday.find(p => p.problemNumber === problem.number)?.completedAt
            }));
        }

        return NextResponse.json({
            activePath: {
                ...activePath,
                todayData,
                id: activePath._id.toString()
            }
        });

    } catch (error) {
        console.error("Get current learning path error:", error);
        return NextResponse.json({ error: "Failed to get learning path" }, { status: 500 });
    }
}