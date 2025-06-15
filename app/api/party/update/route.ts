import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { partyCode, partyName, password, maxMembers } = await req.json();

        // Validation
        if (!partyCode) {
            return NextResponse.json({ error: "Party code is required" }, { status: 400 });
        }

        if (!partyName || partyName.trim().length === 0) {
            return NextResponse.json({ error: "Party name is required" }, { status: 400 });
        }

        if (partyName.trim().length > 50) {
            return NextResponse.json({ error: "Party name must be 50 characters or less" }, { status: 400 });
        }

        if (password && password.length > 100) {
            return NextResponse.json({ error: "Password must be 100 characters or less" }, { status: 400 });
        }

        if (maxMembers !== null && (maxMembers < 2 || maxMembers > 50)) {
            return NextResponse.json({ error: "Member limit must be between 2 and 50" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const parties = db.collection("parties");

        // Find the party
        const party = await parties.findOne({ code: partyCode.toUpperCase() });
        if (!party) {
            return NextResponse.json({ error: "Party not found" }, { status: 404 });
        }

        // Check if user is the owner
        const member = party.members.find((m: any) => m.email === session.user?.email);
        if (!member || !member.isOwner) {
            return NextResponse.json({ error: "Only the party owner can update settings" }, { status: 403 });
        }

        // Check if new member limit would kick existing members
        if (maxMembers && maxMembers < party.members.length) {
            return NextResponse.json({ 
                error: `Cannot set member limit to ${maxMembers} as there are currently ${party.members.length} members in the party` 
            }, { status: 400 });
        }

        // Check if party name is already taken (excluding current party)
        const existingParty = await parties.findOne({ 
            name: partyName.trim(),
            code: { $ne: partyCode.toUpperCase() }
        });
        
        if (existingParty) {
            return NextResponse.json({ error: "A party with this name already exists" }, { status: 409 });
        }

        // Update party settings
        const updateData: any = {
            name: partyName.trim(),
            password: password || null,
            maxMembers: maxMembers || null,
            lastActivity: new Date()
        };

        await parties.updateOne(
            { code: partyCode.toUpperCase() },
            { $set: updateData } as any
        );

        return NextResponse.json({ 
            success: true, 
            message: "Party settings updated successfully"
        });

    } catch (error) {
        console.error("Update party error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}