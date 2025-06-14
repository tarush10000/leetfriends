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
        const partyCode = searchParams.get('partyCode');

        if (!partyCode) {
            return NextResponse.json({ error: "Party code is required" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const parties = db.collection("parties");
        const challenges = db.collection("challenges");

        // Verify party exists and user is a member
        const party = await parties.findOne({ code: partyCode });
        if (!party) {
            return NextResponse.json({ error: "Party not found" }, { status: 404 });
        }

        const isMember = party.members.some((member: any) =>
            member.email === session.user?.email
        );

        if (!isMember) {
            return NextResponse.json({ error: "You are not a member of this party" }, { status: 403 });
        }

        // Fetch active challenges for this party
        const activeChallenges = await challenges
            .find({
                partyCode,
                status: 'active',
                endTime: { $gt: new Date() } // Only active challenges
            })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({
            success: true,
            challenges: activeChallenges
        });

    } catch (error) {
        console.error("Fetch challenges error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}