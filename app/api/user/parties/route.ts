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

    const joinedCodes = Array.isArray(user?.joinedParties) ? user.joinedParties : [];

    const parties = await db
        .collection("parties")
        .find({
            $or: [
                { code: { $in: joinedCodes } },
                { "members.email": session.user.email }
            ]
        })
        .toArray();

    const uniqueParties = Array.from(new Map(parties.map(p => [p.code, p])).values());

    const result = uniqueParties.map(p => ({
        name: p.name,
        code: p.code,
        memberCount: p.members.length,
    }));

    return NextResponse.json(result);
}
