// app/api/party/create/route.ts - Enhanced with rate limiting and party limits
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { partyCreationLimiter, RATE_LIMITS, getUserLimits } from "@/lib/rateLimit";

// Generate a unique party code
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

        const { partyName, password, maxMembers } = await req.json();

        // Validation
        if (!partyName || partyName.trim().length === 0) {
            return NextResponse.json({ error: "Party name is required" }, { status: 400 });
        }

        if (partyName.trim().length > 50) {
            return NextResponse.json({ error: "Party name must be 50 characters or less" }, { status: 400 });
        }

        if (password && password.length > 100) {
            return NextResponse.json({ error: "Password must be 100 characters or less" }, { status: 400 });
        }

        if (maxMembers && (maxMembers < 2 || maxMembers > 50)) {
            return NextResponse.json({ error: "Member limit must be between 2 and 50" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const parties = db.collection("parties");
        const users = db.collection("users");

        // Get user profile and check if onboarded
        const userProfile = await users.findOne({ email: session.user?.email });
        if (!userProfile?.onboarded) {
            return NextResponse.json({ error: "Please complete your profile setup first" }, { status: 400 });
        }

        // Check user limits
        const userLimits = await getUserLimits(db, session.user.email);
        
        if (userLimits.totalParties >= userLimits.maxParties) {
            return NextResponse.json({ 
                error: `You can only be a member of up to ${userLimits.maxParties} parties` 
            }, { status: 400 });
        }

        if (userLimits.createdParties >= userLimits.maxCreatedParties) {
            return NextResponse.json({ 
                error: `You can only create up to ${userLimits.maxCreatedParties} parties` 
            }, { status: 400 });
        }

        // Rate limiting check
        const rateLimitKey = `party-creation:${session.user.email}`;
        const rateLimit = partyCreationLimiter.checkLimit(
            rateLimitKey,
            RATE_LIMITS.PARTY_CREATION.maxRequests,
            RATE_LIMITS.PARTY_CREATION.windowMs
        );

        if (!rateLimit.allowed) {
            const waitTime = Math.ceil((rateLimit.resetTime - Date.now()) / (1000 * 60 * 60)); // hours
            return NextResponse.json({ 
                error: `Rate limit exceeded. You can create ${RATE_LIMITS.PARTY_CREATION.maxRequests} parties per day. Try again in ${waitTime} hours.`,
                waitTime
            }, { status: 429 });
        }

        // Check if party name already exists
        const existingParty = await parties.findOne({ name: partyName.trim() });
        if (existingParty) {
            return NextResponse.json({ error: "A party with this name already exists" }, { status: 409 });
        }

        // Generate unique party code
        let partyCode: string;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            partyCode = generatePartyCode();
            const existingCode = await parties.findOne({ code: partyCode });
            if (!existingCode) break;
            attempts++;
        } while (attempts < maxAttempts);

        if (attempts >= maxAttempts) {
            return NextResponse.json({ 
                error: "Failed to generate unique party code. Please try again." 
            }, { status: 500 });
        }

        const party = {
            code: partyCode,
            name: partyName.trim(),
            password: password?.trim() || null,
            maxMembers: maxMembers || null,
            createdAt: new Date(),
            createdBy: session.user?.email || "",
            members: [
                {
                    email: session.user?.email || "",
                    handle: userProfile.handle,
                    leetcodeUsername: userProfile.leetcodeUsername,
                    displayName: userProfile.displayName || userProfile.handle,
                    joinedAt: new Date(),
                    isOwner: true,
                    // Store the user's current stats as their initial stats for this party
                    initialStats: userProfile.currentStats || { easy: 0, medium: 0, hard: 0, total: 0 },
                    stats: userProfile.currentStats || { easy: 0, medium: 0, hard: 0, total: 0, lastUpdated: new Date() },
                },
            ],
        };

        await parties.insertOne(party as any);

        // Update user record
        await users.updateOne(
            { email: session.user?.email },
            {
                $set: {
                    lastActive: new Date(),
                },
                $addToSet: { joinedParties: partyCode },
            } as any
        );

        return NextResponse.json({ 
            success: true, 
            partyCode,
            message: `Party "${partyName}" created successfully!`,
            remainingCreations: rateLimit.remainingRequests,
            resetTime: rateLimit.resetTime
        });

    } catch (error) {
        console.error("Party creation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}