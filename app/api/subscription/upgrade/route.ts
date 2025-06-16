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

        const { tier, billingCycle } = await req.json();

        if (!['silver', 'gold'].includes(tier)) {
            return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
        }

        if (!['monthly', 'yearly'].includes(billingCycle)) {
            return NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const users = db.collection("users");

        // Get current user
        const user = await users.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // In a real implementation, you would integrate with Stripe here
        // For demo purposes, we'll simulate the upgrade

        const now = new Date();
        const periodEnd = new Date(now);
        if (billingCycle === 'monthly') {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }

        // Update user subscription
        const updatedUser = await users.updateOne(
            { email: session.user.email },
            {
                $set: {
                    subscription: {
                        tier: tier,
                        status: 'trialing', // Start with trial
                        currentPeriodStart: now,
                        currentPeriodEnd: periodEnd,
                        cancelAtPeriodEnd: false,
                        trialEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days trial
                    },
                    updatedAt: now
                }
            }
        );

        if (updatedUser.modifiedCount === 0) {
            return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
        }

        // In a real app, you would:
        // 1. Create Stripe customer if doesn't exist
        // 2. Create Stripe subscription
        // 3. Handle payment method
        // 4. Set up webhooks for subscription events

        return NextResponse.json({
            success: true,
            message: `Successfully upgraded to ${tier} tier!`,
            trialEnd: periodEnd
        });

    } catch (error) {
        console.error("Subscription upgrade error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}