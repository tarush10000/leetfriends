import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = await connectToDatabase();
        const users = db.collection("users");
        const parties = db.collection("parties");

        // Remove user from all parties
        await parties.updateMany(
            { "members.email": session.user?.email },
            { 
                $pull: { members: { email: session.user?.email } } as any,
                $set: { lastActivity: new Date() }
            }
        );

        // Delete parties where user was the only member
        await parties.deleteMany({
            "members": { $size: 0 }
        });

        // Delete user profile
        await users.deleteOne({ email: session.user?.email });

        return NextResponse.json({ 
            success: true, 
            message: "Account deleted successfully" 
        });

    } catch (error) {
        console.error("Error deleting user account:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}