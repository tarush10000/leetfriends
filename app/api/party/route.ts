import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
    const session = await getServerSession();
    const db = await connectToDatabase();
    const party = await db.collection("parties").findOne({ members: { $elemMatch: { email: session?.user?.email } } });
    return NextResponse.json(party);
}