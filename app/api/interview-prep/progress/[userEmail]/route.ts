import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

// GET endpoint to fetch user's interview progress
export async function GET(req: NextRequest, { params }: { params: Promise<{ userEmail: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Await the params Promise in Next.js 13+
        const { userEmail } = await params;
        const decodedEmail = decodeURIComponent(userEmail);

        if (session.user.email !== decodedEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const db = await connectToDatabase();
        const progress = db.collection("interview_progress");

        const completedQuestions = await progress.find({ 
            userEmail: decodedEmail 
        }).toArray();

        const questionIds = completedQuestions.map(p => p.questionId);

        return NextResponse.json({
            completedQuestions: questionIds
        });

    } catch (error) {
        console.error("Progress fetch error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}