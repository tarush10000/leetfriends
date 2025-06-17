import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        // Get the raw body for signature verification
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        if (!signature) {
            console.error("No Razorpay signature found in webhook");
            return NextResponse.json({ error: "Missing signature" }, { status: 400 });
        }

        // Verify webhook signature
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error("RAZORPAY_WEBHOOK_SECRET not configured");
            return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
        }

        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(body)
            .digest("hex");

        if (expectedSignature !== signature) {
            console.error("Webhook signature verification failed");
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        // Parse the webhook payload
        const event = JSON.parse(body);
        console.log("✅ Webhook received:", event.event, "for entity:", event.payload?.subscription?.entity?.id || event.payload?.payment?.entity?.id);

        // Connect to database
        const db = await connectToDatabase();
        const users = db.collection("users");

        // Handle different webhook events
        switch (event.event) {
            case "subscription.activated":
                await handleSubscriptionActivated(event.payload.subscription.entity, users);
                break;

            case "subscription.charged":
                await handleSubscriptionCharged(event.payload.subscription.entity, event.payload.payment.entity, users);
                break;

            case "subscription.completed":
                await handleSubscriptionCompleted(event.payload.subscription.entity, users);
                break;

            case "subscription.cancelled":
                await handleSubscriptionCancelled(event.payload.subscription.entity, users);
                break;

            case "subscription.paused":
                await handleSubscriptionPaused(event.payload.subscription.entity, users);
                break;

            case "subscription.resumed":
                await handleSubscriptionResumed(event.payload.subscription.entity, users);
                break;

            case "payment.failed":
                await handlePaymentFailed(event.payload.payment.entity, users);
                break;

            default:
                console.log("Unhandled webhook event:", event.event);
        }

        return NextResponse.json({ status: "success" });

    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
}

async function handleSubscriptionActivated(subscription: any, users: any) {
    try {
        console.log("🎉 Subscription activated:", subscription.id);

        const userEmail = subscription.notes?.user_email;
        if (!userEmail) {
            console.error("No user email found in subscription notes");
            return;
        }

        const now = new Date();
        const currentPeriodEnd = new Date(subscription.current_end * 1000);

        await users.updateOne(
            { email: userEmail },
            {
                $set: {
                    subscription: {
                        tier: subscription.notes?.tier || 'silver',
                        status: 'active',
                        currentPeriodStart: new Date(subscription.current_start * 1000),
                        currentPeriodEnd: currentPeriodEnd,
                        cancelAtPeriodEnd: false,
                        billingCycle: subscription.notes?.billing_cycle || 'monthly',
                        razorpaySubscriptionId: subscription.id,
                        razorpayCustomerId: subscription.customer_id
                    },
                    updatedAt: now
                },
                $unset: {
                    pendingSubscription: ""
                }
            }
        );

        console.log(`✅ User subscription activated: ${userEmail}`);
    } catch (error) {
        console.error("Error handling subscription activation:", error);
    }
}

async function handleSubscriptionCharged(subscription: any, payment: any, users: any) {
    try {
        console.log("💳 Subscription charged:", subscription.id, "Payment:", payment.id);

        const userEmail = subscription.notes?.user_email;
        if (!userEmail) return;

        const currentPeriodEnd = new Date(subscription.current_end * 1000);

        await users.updateOne(
            { email: userEmail },
            {
                $set: {
                    "subscription.status": "active",
                    "subscription.currentPeriodStart": new Date(subscription.current_start * 1000),
                    "subscription.currentPeriodEnd": currentPeriodEnd,
                    "subscription.lastPaymentId": payment.id,
                    "subscription.lastPaymentAmount": payment.amount,
                    "subscription.lastPaymentDate": new Date(payment.created_at * 1000),
                    updatedAt: new Date()
                }
            }
        );

        console.log(`✅ Subscription charged updated for: ${userEmail}`);
    } catch (error) {
        console.error("Error handling subscription charge:", error);
    }
}

async function handleSubscriptionCompleted(subscription: any, users: any) {
    try {
        console.log("🏁 Subscription completed:", subscription.id);

        const userEmail = subscription.notes?.user_email;
        if (!userEmail) return;

        await users.updateOne(
            { email: userEmail },
            {
                $set: {
                    "subscription.status": "completed",
                    updatedAt: new Date()
                }
            }
        );

        console.log(`✅ Subscription completed for: ${userEmail}`);
    } catch (error) {
        console.error("Error handling subscription completion:", error);
    }
}

async function handleSubscriptionCancelled(subscription: any, users: any) {
    try {
        console.log("❌ Subscription cancelled:", subscription.id);

        const userEmail = subscription.notes?.user_email;
        if (!userEmail) return;

        await users.updateOne(
            { email: userEmail },
            {
                $set: {
                    "subscription.status": "cancelled",
                    "subscription.cancelledAt": new Date(),
                    updatedAt: new Date()
                }
            }
        );

        console.log(`✅ Subscription cancelled for: ${userEmail}`);
    } catch (error) {
        console.error("Error handling subscription cancellation:", error);
    }
}

async function handleSubscriptionPaused(subscription: any, users: any) {
    try {
        console.log("⏸️ Subscription paused:", subscription.id);

        const userEmail = subscription.notes?.user_email;
        if (!userEmail) return;

        await users.updateOne(
            { email: userEmail },
            {
                $set: {
                    "subscription.status": "paused",
                    "subscription.pausedAt": new Date(),
                    updatedAt: new Date()
                }
            }
        );

        console.log(`✅ Subscription paused for: ${userEmail}`);
    } catch (error) {
        console.error("Error handling subscription pause:", error);
    }
}

async function handleSubscriptionResumed(subscription: any, users: any) {
    try {
        console.log("▶️ Subscription resumed:", subscription.id);

        const userEmail = subscription.notes?.user_email;
        if (!userEmail) return;

        await users.updateOne(
            { email: userEmail },
            {
                $set: {
                    "subscription.status": "active",
                    "subscription.resumedAt": new Date(),
                    updatedAt: new Date()
                },
                $unset: {
                    "subscription.pausedAt": ""
                }
            }
        );

        console.log(`✅ Subscription resumed for: ${userEmail}`);
    } catch (error) {
        console.error("Error handling subscription resume:", error);
    }
}

async function handlePaymentFailed(payment: any, users: any) {
    try {
        console.log("💥 Payment failed:", payment.id);

        // You can add logic here to handle payment failures
        // For example, send email notifications, update user status, etc.
        
        console.log(`⚠️ Payment failed for amount: ${payment.amount}, reason: ${payment.error_reason}`);
    } catch (error) {
        console.error("Error handling payment failure:", error);
    }
}