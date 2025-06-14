import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, password, handle, leetcodeUsername } = await req.json();

    if (!code || !handle || !leetcodeUsername) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await connectToDatabase();
    const parties = db.collection("parties");
    const users = db.collection("users");

    const party = await parties.findOne({ code });

    if (!party) {
        return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    if (party.password && party.password !== password) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
    }

    const alreadyMember = party.members.find(m => m.email === session.user?.email);
    if (alreadyMember) {
        return NextResponse.json({ error: "Already a member of this party" }, { status: 409 });
    }

    const newMember = {
        email: session.user?.email,
        handle,
        leetcodeUsername,
        displayName: session.user?.name || handle,
        joinedAt: new Date(),
        stats: { easy: 0, medium: 0, hard: 0, total: 0 },
    };

    await parties.updateOne({ code }, { $push: { members: newMember } });

    await users.updateOne(
        { email: session.user?.email },
        {
            $set: {
                email: session.user?.email,
                handle,
                leetcodeUsername,
                displayName: session.user?.name || handle,
                partyCode: code,
                joinedAt: new Date(),
            },
        },
        { upsert: true }
    );

    return NextResponse.json({ success: true, partyCode: code });
}
