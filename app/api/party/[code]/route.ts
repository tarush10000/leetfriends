import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
    const db = await connectToDatabase();
    const party = await db.collection("parties").findOne({ code: params.code });

    if (!party) {
        return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    return NextResponse.json(party);
}
