import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { challengeId, partyCode } = await req.json();

        if (!challengeId || !partyCode) {
            return NextResponse.json({
                error: "Challenge ID and party code are required"
            }, { status: 400 });
        }

        const db = await connectToDatabase();
        const parties = db.collection("parties");
        const challenges = db.collection("challenges");
        const users = db.collection("users");

        // Verify party membership
        const party = await parties.findOne({ code: partyCode });
        if (!party) {
            return NextResponse.json({ error: "Party not found" }, { status: 404 });
        }

        const member = party.members.find((m: any) => m.email === session.user?.email);
        if (!member) {
            return NextResponse.json({ error: "You are not a member of this party" }, { status: 403 });
        }

        // Get user profile for display name
        const userProfile = await users.findOne({ email: session.user.email });

        // Check if challenge exists and is active
        const challenge = await challenges.findOne({
            _id: new ObjectId(challengeId),
            partyCode,
            status: 'active'
        });

        if (!challenge) {
            return NextResponse.json({ error: "Challenge not found or inactive" }, { status: 404 });
        }

        // Check if user already submitted
        const existingSubmission = challenge.submissions?.find(
            (sub: any) => sub.userEmail === session.user?.email
        );

        if (existingSubmission) {
            return NextResponse.json({
                error: "You have already submitted for this challenge"
            }, { status: 400 });
        }

        // Check if challenge time has expired
        if (new Date() > new Date(challenge.endTime)) {
            return NextResponse.json({ error: "Challenge time has expired" }, { status: 400 });
        }

        // Add submission
        const submission = {
            userEmail: session.user.email,
            userName: userProfile?.displayName || userProfile?.handle || session.user.email,
            submittedAt: new Date(),
            status: 'completed' as const,
            verified: false
        };

        await challenges.updateOne(
            { _id: new ObjectId(challengeId) },
            {
                $push: { submissions: submission } as any
            }
        );

        return NextResponse.json({
            success: true,
            message: "Submission recorded successfully!"
        });

    } catch (error) {
        console.error("Submit challenge error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}