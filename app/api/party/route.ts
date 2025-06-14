import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json([], { status: 200 });
        }

        const db = await connectToDatabase();

        // Find all parties where the user is a member
        const parties = await db
            .collection("parties")
            .find({
                "members.email": session.user.email
            })
            .toArray();

        const result = parties.map(party => {
            const userMember = party.members.find((m: any) => m.email === session.user?.email);

            return {
                name: party.name,
                code: party.code,
                memberCount: party.members.length,
                maxMembers: party.maxMembers || null,
                createdAt: party.createdAt,
                isOwner: userMember?.isOwner || party.createdBy === session.user?.email || false,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching user parties:", error);
        return NextResponse.json([], { status: 500 });
    }
}