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

        const { handle, leetcodeUsername, initialStats } = await req.json();

        if (!handle || !leetcodeUsername || !initialStats) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (handle.length < 2 || handle.length > 20) {
            return NextResponse.json({ error: "Handle must be between 2 and 20 characters" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const users = db.collection("users");

        // Check if user already exists
        const existingUser = await users.findOne({ email: session.user?.email });
        if (existingUser?.onboarded) {
            return NextResponse.json({ error: "User already onboarded" }, { status: 400 });
        }

        // Check if handle is already taken
        const handleExists = await users.findOne({ handle: handle.trim() });
        if (handleExists && handleExists.email !== session.user?.email) {
            return NextResponse.json({ error: "Handle already taken" }, { status: 400 });
        }

        // Check if LeetCode username is already taken
        const leetcodeExists = await users.findOne({ leetcodeUsername: leetcodeUsername.trim() });
        if (leetcodeExists && leetcodeExists.email !== session.user?.email) {
            return NextResponse.json({ error: "LeetCode username already registered" }, { status: 400 });
        }

        // Create/update user profile
        await users.updateOne(
            { email: session.user?.email },
            {
                $set: {
                    email: session.user?.email || "",
                    handle: handle.trim(),
                    leetcodeUsername: leetcodeUsername.trim(),
                    displayName: session.user?.name || handle.trim(),
                    initialStats: {
                        ...initialStats,
                        recordedAt: new Date(),
                    },
                    currentStats: {
                        ...initialStats,
                        lastUpdated: new Date(),
                    },
                    onboarded: true,
                    onboardedAt: new Date(),
                    lastActive: new Date(),
                },
                $setOnInsert: {
                    createdAt: new Date(),
                    joinedParties: [],
                },
            },
            { upsert: true }
        );

        return NextResponse.json({ 
            success: true, 
            message: "Profile setup completed successfully!" 
        });

    } catch (error) {
        console.error("User onboarding error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}