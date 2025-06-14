import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json({ error: "Party code is required" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const parties = db.collection("parties");

        const party = await parties.findOne({ code: code.toUpperCase() });

        if (!party) {
            return NextResponse.json({
                isValid: false,
                error: "Party not found"
            });
        }

        // Check if user is already a member
        const alreadyMember = party.members.find((m: any) => m.email === session.user?.email);
        if (alreadyMember) {
            return NextResponse.json({
                isValid: false,
                error: "You are already a member of this party"
            });
        }

        // Check if party is full
        if (party.maxMembers && party.members.length >= party.maxMembers) {
            return NextResponse.json({
                isValid: false,
                error: `Party is full (${party.members.length}/${party.maxMembers} members)`
            });
        }

        return NextResponse.json({
            isValid: true,
            partyInfo: {
                name: party.name,
                memberCount: party.members.length,
                maxMembers: party.maxMembers,
                hasPassword: !!party.password,
                createdAt: party.createdAt
            }
        });

    } catch (error) {
        console.error("Party validation error:", error);
        return NextResponse.json({
            isValid: false,
            error: "Internal server error"
        }, { status: 500 });
    }
}