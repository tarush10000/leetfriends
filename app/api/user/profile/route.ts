import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

// GET - Fetch user profile
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = await connectToDatabase();
        const users = db.collection("users");

        const user = await users.findOne({ email: session.user?.email });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);

    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT - Update user profile
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { handle, leetcodeUsername } = await req.json();

        if (!handle || !leetcodeUsername) {
            return NextResponse.json({ error: "Handle and LeetCode username are required" }, { status: 400 });
        }

        if (handle.length < 2 || handle.length > 20) {
            return NextResponse.json({ error: "Handle must be between 2 and 20 characters" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const users = db.collection("users");

        // Check if handle is taken by another user
        const handleExists = await users.findOne({ 
            handle: handle.trim(),
            email: { $ne: session.user?.email }
        });
        if (handleExists) {
            return NextResponse.json({ error: "Handle already taken" }, { status: 400 });
        }

        // Check if LeetCode username is taken by another user
        const leetcodeExists = await users.findOne({ 
            leetcodeUsername: leetcodeUsername.trim(),
            email: { $ne: session.user?.email }
        });
        if (leetcodeExists) {
            return NextResponse.json({ error: "LeetCode username already registered" }, { status: 400 });
        }

        // Update user profile
        await users.updateOne(
            { email: session.user?.email },
            {
                $set: {
                    handle: handle.trim(),
                    leetcodeUsername: leetcodeUsername.trim(),
                    lastActive: new Date(),
                }
            }
        );

        return NextResponse.json({ 
            success: true, 
            message: "Profile updated successfully" 
        });

    } catch (error) {
        console.error("Error updating user profile:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}