import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { learningPathId } = await req.json();
        const db = await connectToDatabase();
        const learningPaths = db.collection("learning_paths");

        // Delete any previous unaccepted paths
        await learningPaths.deleteMany({
            userId: session.user.email,
            status: 'generated',
            _id: { $ne: new ObjectId(learningPathId) }  // keep the one being accepted
        });

        // Update new learning path to accepted
        const result = await learningPaths.updateOne(
            {
                _id: new ObjectId(learningPathId),
                userId: session.user.email,
                status: 'generated'
            },
            {
                $set: {
                    status: 'in_progress',
                    acceptedAt: new Date(),
                    'progress.currentDay': 1
                }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: "Learning path not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Learning path accepted and started!" });

    } catch (error) {
        console.error("Accept learning path error:", error);
        return NextResponse.json({ error: "Failed to accept learning path" }, { status: 500 });
    }
}
