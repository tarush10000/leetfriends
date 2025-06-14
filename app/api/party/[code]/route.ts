import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

interface RouteParams {
    params: Promise<{
        code: string;
    }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        // Await params in Next.js 15+
        const { code } = await params;

        const db = await connectToDatabase();
        const party = await db.collection("parties").findOne({ code });

        if (!party) {
            return NextResponse.json({ error: "Party not found" }, { status: 404 });
        }

        return NextResponse.json(party);
    } catch (error) {
        console.error("Get party error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}