import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        const db = await connectToDatabase();
        const learningPaths = db.collection("learning_paths");

        const paths = await learningPaths
            .find({ userId: session.user.email })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        const total = await learningPaths.countDocuments({ userId: session.user.email });

        return NextResponse.json({
            paths: paths.map(path => ({
                ...path,
                id: path._id.toString()
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Get learning path history error:", error);
        return NextResponse.json({ error: "Failed to get learning path history" }, { status: 500 });
    }
}