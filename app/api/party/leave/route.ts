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

        const { partyCode } = await req.json();

        if (!partyCode) {
            return NextResponse.json({ error: "Party code is required" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const parties = db.collection("parties");
        const users = db.collection("users");

        // Find the party
        const party = await parties.findOne({ code: partyCode.toUpperCase() });
        if (!party) {
            return NextResponse.json({ error: "Party not found" }, { status: 404 });
        }

        // Check if user is a member
        const memberIndex = party.members.findIndex((m: any) => m.email === session.user?.email);
        if (memberIndex === -1) {
            return NextResponse.json({ error: "You are not a member of this party" }, { status: 400 });
        }

        const member = party.members[memberIndex];

        // Check if user is the owner
        if (member.isOwner) {
            // If owner is leaving and there are other members, transfer ownership to the oldest member
            if (party.members.length > 1) {
                const oldestMember = party.members
                    .filter((m: any) => m.email !== session.user?.email)
                    .sort((a: any, b: any) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime())[0];

                // Transfer ownership
                await parties.updateOne(
                    { code: partyCode.toUpperCase() },
                    {
                        $set: {
                            "members.$[owner].isOwner": false,
                            "members.$[newOwner].isOwner": true,
                            createdBy: oldestMember.email,
                            lastActivity: new Date()
                        }
                    },
                    {
                        arrayFilters: [
                            { "owner.email": session.user?.email },
                            { "newOwner.email": oldestMember.email }
                        ]
                    }
                );
            } else {
                // If owner is the only member, delete the party
                await parties.deleteOne({ code: partyCode.toUpperCase() });
                
                // Remove party from user's joined parties
                await users.updateOne(
                    { email: session.user?.email },
                    {
                        $pull: { joinedParties: partyCode.toUpperCase() } as any,
                        $set: { lastActive: new Date() }
                    } as any
                );

                return NextResponse.json({ 
                    success: true, 
                    message: "Party deleted successfully as you were the only member",
                    partyDeleted: true
                });
            }
        }

        // Remove member from party
        await parties.updateOne(
            { code: partyCode.toUpperCase() },
            {
                $pull: { members: { email: session.user?.email } } as any,
                $set: { lastActivity: new Date() }
            } as any
        );

        // Remove party from user's joined parties
        await users.updateOne(
            { email: session.user?.email },
            {
                $pull: { joinedParties: partyCode.toUpperCase() } as any,
                $set: { lastActive: new Date() }
            } as any
        );

        return NextResponse.json({ 
            success: true, 
            message: "Successfully left the party"
        });

    } catch (error) {
        console.error("Leave party error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}