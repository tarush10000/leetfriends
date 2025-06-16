import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { canUserCreateParty, getUserTierLimits } from "@/lib/subscription";

function generatePartyCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, password, maxMembers = 10 } = await req.json();

        if (!name || name.trim().length === 0) {
            return NextResponse.json({ error: "Party name is required" }, { status: 400 });
        }

        if (name.length > 50) {
            return NextResponse.json({ error: "Party name too long" }, { status: 400 });
        }

        if (maxMembers < 2 || maxMembers > 50) {
            return NextResponse.json({ error: "Max members must be between 2 and 50" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const users = db.collection("users");
        const parties = db.collection("parties");

        // Get user with subscription info
        const user = await users.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!user.onboarded) {
            return NextResponse.json({ error: "User not onboarded" }, { status: 400 });
        }

        // Check user's current party count (parties they've created)
        const userCreatedPartyCount = await parties.countDocuments({
            createdBy: session.user.email
        });

        const userTier = user.subscription?.tier || 'free';
        
        // Check if user can create more parties
        if (!canUserCreateParty(userTier, userCreatedPartyCount)) {
            const tierLimits = getUserTierLimits(userTier);
            return NextResponse.json({ 
                error: "Party creation limit reached", 
                limit: tierLimits.maxParties,
                currentCount: userCreatedPartyCount,
                upgradeRequired: true,
                currentTier: userTier,
                message: `You've reached your ${tierLimits.name} plan limit of ${tierLimits.maxParties} parties. Upgrade to create more!`
            }, { status: 403 });
        }

        // Generate unique party code
        let code: string;
        let attempts = 0;
        do {
            code = generatePartyCode();
            const existingParty = await parties.findOne({ code });
            if (!existingParty) break;
            attempts++;
        } while (attempts < 10);

        if (attempts >= 10) {
            return NextResponse.json({ error: "Failed to generate unique party code" }, { status: 500 });
        }

        // Create party
        const party = {
            code,
            name: name.trim(),
            password: password || null,
            maxMembers,
            createdBy: session.user.email,
            createdAt: new Date(),
            members: [
                {
                    email: session.user.email,
                    name: user.name || session.user.name,
                    handle: user.handle,
                    displayName: user.displayName || user.handle,
                    joinedAt: new Date(),
                    isOwner: true,
                    stats: user.currentStats || { easy: 0, medium: 0, hard: 0, total: 0 }
                }
            ]
        };

        const result = await parties.insertOne(party);
        
        if (!result.insertedId) {
            return NextResponse.json({ error: "Failed to create party" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            party: {
                code: party.code,
                name: party.name,
                maxMembers: party.maxMembers,
                memberCount: 1,
                createdAt: party.createdAt.toISOString(),
                isOwner: true
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Party creation error:", error);
        return NextResponse.json(
            { error: "Internal server error" }, 
            { status: 500 }
        );
    }
}