import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

// POST endpoint to update interview progress
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userEmail, questionId, isCompleted } = await req.json();

        if (session.user.email !== userEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const db = await connectToDatabase();
        const progress = db.collection("interview_progress");

        if (isCompleted) {
            // Add progress entry
            const progressEntry = {
                userEmail,
                questionId,
                completedAt: new Date(),
                // Extract company and difficulty from questionId if possible
                company: questionId.split('-')[0] || 'unknown',
                difficulty: extractDifficultyFromQuestionId(questionId) || 'medium',
            };

            await progress.insertOne(progressEntry);
        } else {
            // Remove progress entry
            await progress.deleteOne({ userEmail, questionId });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Progress update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Helper function to extract difficulty from questionId
function extractDifficultyFromQuestionId(questionId: string): string {
    // This is a simple implementation - you might want to improve this
    // based on your actual questionId format
    const lowerCaseId = questionId.toLowerCase();
    if (lowerCaseId.includes('easy')) return 'Easy';
    if (lowerCaseId.includes('medium')) return 'Medium';
    if (lowerCaseId.includes('hard')) return 'Hard';
    return 'Medium'; // default
}