import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { handle, leetcodeUsername, displayName } = await req.json();

    if (!handle || !leetcodeUsername) {
      return NextResponse.json({ error: "Handle and LeetCode username are required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    const users = db.collection("users");

    const existingUser = await users.findOne({ email: session.user.email });

    // Prevent duplicate handles or usernames across users
    const handleExists = await users.findOne({ handle: handle.trim() });
    if (handleExists && handleExists.email !== session.user.email) {
      return NextResponse.json({ error: "Handle already taken" }, { status: 400 });
    }

    const leetcodeExists = await users.findOne({ leetcodeUsername: leetcodeUsername.trim() });
    if (leetcodeExists && leetcodeExists.email !== session.user.email) {
      return NextResponse.json({ error: "LeetCode username already registered" }, { status: 400 });
    }

    const stats = {
      easy: 0,
      medium: 0,
      hard: 0,
      total: 0,
    };

    await users.updateOne(
      { email: session.user.email },
      {
        $set: {
          email: session.user.email,
          handle: handle.trim(),
          leetcodeUsername: leetcodeUsername.trim(),
          displayName: displayName?.trim() || handle.trim(),
          initialStats: {
            ...stats,
            recordedAt: new Date(),
          },
          currentStats: {
            ...stats,
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

    return NextResponse.json({ success: true, message: "Profile setup completed successfully!" });
  } catch (error) {
    console.error("User setup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
