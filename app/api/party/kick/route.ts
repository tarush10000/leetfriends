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

        const { partyCode, memberEmail } = await req.json();

        // Validation
        if (!partyCode || !memberEmail) {
            return NextResponse.json({ error: "Party code and member email are required" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const parties = db.collection("parties");
        const users = db.collection("users");

        // Find the party
        const party = await parties.findOne({ code: partyCode.toUpperCase() });
        if (!party) {
            return NextResponse.json({ error: "Party not found" }, { status: 404 });
        }

        // Check if user is the owner
        const requester = party.members.find((m: any) => m.email === session.user?.email);
        if (!requester || !requester.isOwner) {
            return NextResponse.json({ error: "Only the party owner can remove members" }, { status: 403 });
        }

        // Check if member to be kicked exists
        const memberToKick = party.members.find((m: any) => m.email === memberEmail);
        if (!memberToKick) {
            return NextResponse.json({ error: "Member not found in this party" }, { status: 404 });
        }

        // Prevent owner from kicking themselves
        if (memberEmail === session.user?.email) {
            return NextResponse.json({ error: "You cannot remove yourself. Use leave party instead" }, { status: 400 });
        }

        // Prevent kicking other owners (if multiple owners exist)
        if (memberToKick.isOwner) {
            return NextResponse.json({ error: "You cannot remove another owner" }, { status: 400 });
        }

        // Remove member from party
        await parties.updateOne(
            { code: partyCode.toUpperCase() },
            {
                $pull: { members: { email: memberEmail } } as any,
                $set: { lastActivity: new Date() }
            } as any
        );

        // Remove party from user's joined parties
        await users.updateOne(
            { email: memberEmail },
            {
                $pull: { joinedParties: partyCode.toUpperCase() } as any,
                $set: { lastActive: new Date() }
            } as any
        );

        return NextResponse.json({ 
            success: true, 
            message: `Successfully removed ${memberToKick.displayName || memberToKick.handle} from the party`
        });

    } catch (error) {
        console.error("Kick member error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}