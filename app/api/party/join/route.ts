import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { code, password } = await req.json();

        // Validation
        if (!code) {
            return NextResponse.json({ error: "Party code is required" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const parties = db.collection("parties");
        const users = db.collection("users");

        // Get user profile
        const userProfile = await users.findOne({ email: session.user?.email });
        if (!userProfile?.onboarded) {
            return NextResponse.json({ error: "Please complete your profile setup first" }, { status: 400 });
        }

        // Find the party
        const party = await parties.findOne({ code: code.toUpperCase() });

        if (!party) {
            return NextResponse.json({ error: "Party not found. Please check the party code." }, { status: 404 });
        }

        // Check password if required
        if (party.password && party.password !== password) {
            return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
        }

        // Check if already a member
        const alreadyMember = party.members.find((m: any) => m.email === session.user?.email);
        if (alreadyMember) {
            return NextResponse.json({ error: "You are already a member of this party" }, { status: 409 });
        }

        // Check member limit
        if (party.maxMembers && party.members.length >= party.maxMembers) {
            return NextResponse.json({ 
                error: `This party is full (${party.maxMembers}/${party.maxMembers} members)` 
            }, { status: 400 });
        }

        // Check if user is in too many parties
        const userParties = await parties.countDocuments({
            "members.email": session.user?.email
        });

        if (userParties >= 10) {
            return NextResponse.json({ error: "You can only be a member of up to 10 parties" }, { status: 400 });
        }

        // Check for duplicate handles in the party
        const duplicateHandle = party.members.find((m: any) => 
            m.handle.toLowerCase() === userProfile.handle.toLowerCase()
        );
        if (duplicateHandle) {
            return NextResponse.json({ 
                error: "Your handle is already taken in this party. Please update your handle in settings." 
            }, { status: 400 });
        }

        // Check for duplicate LeetCode usernames in the party
        const duplicateLeetcode = party.members.find((m: any) => 
            m.leetcodeUsername.toLowerCase() === userProfile.leetcodeUsername.toLowerCase()
        );
        if (duplicateLeetcode) {
            return NextResponse.json({ 
                error: "Your LeetCode username is already registered in this party." 
            }, { status: 400 });
        }

        const newMember = {
            email: session.user?.email || "",
            handle: userProfile.handle,
            leetcodeUsername: userProfile.leetcodeUsername,
            displayName: userProfile.displayName || userProfile.handle,
            joinedAt: new Date(),
            isOwner: false,
            // Store the user's current stats as their initial stats for this party
            initialStats: userProfile.currentStats || { easy: 0, medium: 0, hard: 0, total: 0 },
            stats: userProfile.currentStats || { easy: 0, medium: 0, hard: 0, total: 0, lastUpdated: new Date() },
        };

        // Add member to party
        await parties.updateOne(
            { code: code.toUpperCase() },
            { 
                $push: { members: newMember },
                $set: { lastActivity: new Date() }
            } as any
        );

        // Update user record
        await users.updateOne(
            { email: session.user?.email },
            {
                $set: {
                    lastActive: new Date(),
                },
                $addToSet: { joinedParties: code.toUpperCase() },
            } as any
        );

        return NextResponse.json({ 
            success: true, 
            partyCode: code.toUpperCase(),
            partyName: party.name,
            message: `Successfully joined "${party.name}"!`
        });

    } catch (error) {
        console.error("Party join error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}