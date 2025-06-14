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
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { partyName, password, maxMembers } = await req.json();

        // Validation
        if (!partyName) {
            return NextResponse.json({ error: "Party name is required" }, { status: 400 });
        }

        if (partyName.length < 3 || partyName.length > 50) {
            return NextResponse.json({ error: "Party name must be between 3 and 50 characters" }, { status: 400 });
        }

        if (maxMembers !== null && (maxMembers < 2 || maxMembers > 100)) {
            return NextResponse.json({ error: "Member limit must be between 2 and 100" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const parties = db.collection("parties");
        const users = db.collection("users");

        // Get user profile
        const userProfile = await users.findOne({ email: session.user?.email });
        if (!userProfile?.onboarded) {
            return NextResponse.json({ error: "Please complete your profile setup first" }, { status: 400 });
        }

        // Generate unique party code
        let partyCode: string;
        let attempts = 0;
        do {
            partyCode = generatePartyCode();
            const existing = await parties.findOne({ code: partyCode });
            if (!existing) break;
            attempts++;
        } while (attempts < 10);

        if (attempts >= 10) {
            return NextResponse.json({ error: "Failed to generate unique party code. Please try again." }, { status: 500 });
        }

        // Check if user is already in too many parties
        const userParties = await parties.countDocuments({
            "members.email": session.user?.email
        });

        if (userParties >= 10) {
            return NextResponse.json({ error: "You can only be a member of up to 10 parties" }, { status: 400 });
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
            message: `Party "${partyName}" created successfully!`
        });

    } catch (error) {
        console.error("Party creation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}