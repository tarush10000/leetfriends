import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { razorpay } from "@/lib/razorpay";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const subscriptionId = searchParams.get('subscription_id');

        if (!subscriptionId) {
            return NextResponse.json({ error: "Subscription ID required" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const users = db.collection("users");
        
        const user = await users.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Fetch subscription status from Razorpay
        const subscription = await razorpay.subscriptions.fetch(subscriptionId);

        // Update local database with latest status
        if (user.pendingSubscription?.razorpaySubscriptionId === subscriptionId) {
            await users.updateOne(
                { email: session.user.email },
                {
                    $set: {
                        "pendingSubscription.status": subscription.status,
                        "pendingSubscription.currentStart": subscription.current_start,
                        "pendingSubscription.currentEnd": subscription.current_end,
                        "pendingSubscription.paidCount": subscription.paid_count,
                        "pendingSubscription.remainingCount": subscription.remaining_count,
                        updatedAt: new Date()
                    }
                }
            );
        }

        return NextResponse.json({
            subscriptionId: subscription.id,
            status: subscription.status,
            currentStart: subscription.current_start,
            currentEnd: subscription.current_end,
            paidCount: subscription.paid_count,
            remainingCount: subscription.remaining_count,
            totalCount: subscription.total_count,
            nextChargeAt: subscription.charge_at,
            shortUrl: subscription.short_url
        });

    } catch (error) {
        console.error("Subscription status check error:", error);
        return NextResponse.json(
            { error: "Failed to fetch subscription status" },
            { status: 500 }
        );
    }
}