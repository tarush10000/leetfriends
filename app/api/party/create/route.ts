import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

function generatePartyCode(length = 6): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { partyName, password, leetcodeUsername, handle } = await req.json();

    if (!partyName || !leetcodeUsername || !handle) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await connectToDatabase();
    const parties = db.collection("parties");
    const users = db.collection("users");

    const partyCode = generatePartyCode();

    const party = {
        code: partyCode,
        name: partyName,
        password: password || null,
        createdAt: new Date(),
        members: [
            {
                email: session.user?.email,
                handle,
                leetcodeUsername,
                displayName: session.user?.name || handle,
                joinedAt: new Date(),
                stats: { easy: 0, medium: 0, hard: 0, total: 0 },
            },
        ],
    };

    await parties.insertOne(party);

    await users.updateOne(
        { email: session.user?.email },
        {
            $setOnInsert: {
                email: session.user?.email,
                displayName: session.user?.name,
            },
            $addToSet: { joinedParties: partyCode },
        },
        { upsert: true }
    );

    return NextResponse.json({ success: true, partyCode });
}
