import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getUserTierLimits, canUserCreateParty, canUserAccessFeature } from "@/lib/subscription";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = await connectToDatabase();
        const users = db.collection("users");
        const parties = db.collection("parties");

        const user = await users.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userTier = user.subscription?.tier || 'free';
        const tierLimits = getUserTierLimits(userTier);

        // Count user's created parties
        const createdPartyCount = await parties.countDocuments({
            createdBy: session.user.email
        });

        // Count user's total parties (including joined)
        const totalPartyCount = await parties.countDocuments({
            "members.email": session.user.email
        });

        return NextResponse.json({
            currentTier: userTier,
            tierLimits: {
                name: tierLimits.name,
                maxParties: tierLimits.maxParties,
                hasAIInsights: tierLimits.hasAIInsights,
                hasInterviewPrep: tierLimits.hasInterviewPrep
            },
            usage: {
                createdParties: createdPartyCount,
                totalParties: totalPartyCount
            },
            permissions: {
                canCreateParty: canUserCreateParty(userTier, createdPartyCount),
                canAccessInsights: canUserAccessFeature(userTier, 'insights'),
                canAccessInterviewPrep: canUserAccessFeature(userTier, 'interview-prep')
            }
        });

    } catch (error) {
        console.error("Subscription limits check error:", error);
        return NextResponse.json(
            { error: "Internal server error" }, 
            { status: 500 }
        );
    }
}