import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json([], { status: 200 });
    }

    const db = await connectToDatabase();
    const user = await db.collection("users").findOne({ email: session.user.email });

    if (!user?.joinedParties || user.joinedParties.length === 0) {
        return NextResponse.json([]);
    }

    const parties = await db
        .collection("parties")
        .find({ code: { $in: user.joinedParties } })
        .toArray();

    const result = parties.map(p => ({
        name: p.name,
        code: p.code,
        memberCount: p.members.length,
    }));

    return NextResponse.json(result);
}
