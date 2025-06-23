// app/api/payments/verify-payment/route.ts - Fixed according to Razorpay docs
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
            razorpay_order_id,
            razorpay_signature,
            tier,
            billingCycle,
            couponCode
        } = await req.json();

        console.log('🔐 Starting payment verification for user:', session.user.email);

        // Verify required parameters according to Razorpay docs
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return NextResponse.json({
                error: "Missing required payment parameters",
                required: ["razorpay_payment_id", "razorpay_order_id", "razorpay_signature"]
            }, { status: 400 });
        }

        // Get Razorpay secret key
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            console.error("RAZORPAY_KEY_SECRET not configured");
            return NextResponse.json({
                error: "Payment gateway configuration error"
            }, { status: 500 });
        }

        // Connect to database
        const db = await connectToDatabase();
        const users = db.collection("users");
        const coupons = db.collection("coupons");

        // Get current user and pending order
        const user = await users.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({
                error: "User not found"
            }, { status: 404 });
        }

        // Verify that this order belongs to this user
        if (!user.pendingOrder || user.pendingOrder.razorpayOrderId !== razorpay_order_id) {
            console.error("Order mismatch:", {
                expectedOrderId: user.pendingOrder?.razorpayOrderId,
                receivedOrderId: razorpay_order_id
            });
            return NextResponse.json({
                error: "Order verification failed. Order does not belong to this user."
            }, { status: 400 });
        }

        // Create signature verification string according to Razorpay docs
        // Format: order_id + "|" + razorpay_payment_id
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        
        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(body.toString())
            .digest("hex");

        console.log('🔍 Signature verification:', {
            body,
            expectedLength: expectedSignature.length,
            receivedLength: razorpay_signature.length,
            match: expectedSignature === razorpay_signature
        });

        // Verify signature
        if (expectedSignature !== razorpay_signature) {
            console.error("Payment signature verification failed", {
                expected: expectedSignature,
                received: razorpay_signature,
                body
            });
            return NextResponse.json({
                error: "Payment verification failed. Invalid signature."
            }, { status: 400 });
        }

        console.log("✅ Payment signature verified successfully");

        // Calculate subscription period
        const now = new Date();
        const periodStart = new Date(now);
        const periodEnd = new Date(now);
        
        if (billingCycle === 'monthly') {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }

        // Prepare subscription data
        type SubscriptionData = {
            tier: any;
            status: string;
            currentPeriodStart: Date;
            currentPeriodEnd: Date;
            cancelAtPeriodEnd: boolean;
            billingCycle: any;
            razorpayOrderId: any;
            razorpayPaymentId: any;
            amount: any;
            currency: any;
            createdAt: Date;
            lastPaymentAt: Date;
            couponUsed?: string;
        };

        const subscriptionData: SubscriptionData = {
            tier: tier,
            status: 'active',
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            billingCycle: billingCycle,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            amount: user.pendingOrder.amount,
            currency: user.pendingOrder.currency,
            createdAt: now,
            lastPaymentAt: now
        };

        // Add coupon info if used
        if (couponCode) {
            subscriptionData.couponUsed = couponCode;
            
            // Update coupon usage count
            const couponUpdate = await coupons.updateOne(
                { 
                    code: couponCode.toUpperCase(),
                    isActive: true,
                    $or: [
                        { maxUses: { $gt: "$usedCount" } },
                        { maxUses: -1 }
                    ]
                },
                {
                    $inc: { usedCount: 1 },
                    $push: {
                        usedBy: {
                            userEmail: session.user.email,
                            userName: session.user.name || 'Unknown User',
                            usedAt: now,
                            tier: tier,
                            billingCycle: billingCycle,
                            paymentId: razorpay_payment_id,
                            orderId: razorpay_order_id,
                            amount: user.pendingOrder.amount
                        } as any
                    }
                }
            );

            if (couponUpdate.matchedCount === 0) {
                console.warn('Coupon not found or already fully used:', couponCode);
            }
        }

        // Update user subscription and clear pending order
        const updateResult = await users.updateOne(
            { email: session.user.email },
            {
                $set: {
                    subscription: subscriptionData,
                    updatedAt: now
                },
                $unset: {
                    pendingOrder: "",
                    pendingSubscription: ""
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return NextResponse.json({
                error: "Failed to update user subscription"
            }, { status: 500 });
        }

        console.log(`✅ Subscription activated for user: ${session.user.email}, tier: ${tier}, period: ${billingCycle}`);

        // Return success response
        return NextResponse.json({
            success: true,
            message: "Payment verified and subscription activated successfully",
            subscription: {
                tier,
                status: 'active',
                billingCycle,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                ...(couponCode && { couponUsed: couponCode }),
                paymentDetails: {
                    paymentId: razorpay_payment_id,
                    orderId: razorpay_order_id,
                    amount: user.pendingOrder.amount,
                    currency: user.pendingOrder.currency
                }
            }
        });

    } catch (error) {
        console.error("Payment verification error:", error);
        return NextResponse.json({
            error: "Internal server error",
            message: "Failed to verify payment. Please contact support if amount was deducted."
        }, { status: 500 });
    }
}