import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const {
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature,
            couponCode,
            tier,
            billingCycle
        } = await req.json();

        // Verify required parameters
        if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
            return NextResponse.json({
                error: "Missing required payment parameters"
            }, { status: 400 });
        }

        // Verify Razorpay signature
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            console.error("RAZORPAY_KEY_SECRET not configured");
            return NextResponse.json({
                error: "Payment gateway configuration error"
            }, { status: 500 });
        }

        // Create signature verification string
        const body = razorpay_payment_id + "|" + razorpay_subscription_id;
        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(body.toString())
            .digest("hex");

        // Verify signature
        if (expectedSignature !== razorpay_signature) {
            console.error("Payment signature verification failed", {
                expected: expectedSignature,
                received: razorpay_signature
            });
            return NextResponse.json({
                error: "Payment verification failed"
            }, { status: 400 });
        }

        console.log("✅ Payment signature verified successfully");

        // Connect to database
        const db = await connectToDatabase();
        const users = db.collection("users");
        const coupons = db.collection("coupons");

        // Get current user
        const user = await users.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({
                error: "User not found"
            }, { status: 404 });
        }

        // Calculate subscription period
        const now = new Date();
        const periodEnd = new Date(now);
        
        if (billingCycle === 'monthly') {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }

        // Update user subscription
        const updateData: any = {
            subscription: {
                tier: tier,
                status: 'active',
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: false,
                billingCycle: billingCycle,
                razorpaySubscriptionId: razorpay_subscription_id,
                razorpayPaymentId: razorpay_payment_id
            },
            updatedAt: now
        };

        // Add coupon info if used
        if (couponCode) {
            updateData.subscription.couponUsed = couponCode;
            
            // Update coupon usage count
            await coupons.updateOne(
                { code: couponCode.toUpperCase() },
                {
                    $inc: { usedCount: 1 },
                    $push: {
                        usedBy: {
                            userEmail: session.user.email,
                            userName: session.user.name || 'Unknown User',
                            usedAt: now,
                            tier: tier as string,
                            billingCycle: billingCycle as string,
                            paymentId: razorpay_payment_id as string,
                            subscriptionId: razorpay_subscription_id as string
                        }
                    } as any
                }
            );
        }

        // Update user in database
        await users.updateOne(
            { email: session.user.email },
            { $set: updateData }
        );

        // Clear pending subscription if it exists
        await users.updateOne(
            { email: session.user.email },
            { $unset: { pendingSubscription: "" } }
        );

        console.log(`✅ Subscription activated for user: ${session.user.email}, tier: ${tier}`);

        return NextResponse.json({
            success: true,
            message: "Payment verified and subscription activated",
            subscription: {
                tier,
                status: 'active',
                billingCycle,
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                ...(couponCode && { couponUsed: couponCode })
            }
        });

    } catch (error) {
        console.error("Payment verification error:", error);
        return NextResponse.json({
            error: "Internal server error",
            message: "Failed to verify payment. Please contact support."
        }, { status: 500 });
    }
}