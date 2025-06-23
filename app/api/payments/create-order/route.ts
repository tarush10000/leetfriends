// app/api/payments/create-order/route.ts - DEBUG VERSION
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getRazorpayInstance } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { amount, currency = "INR", tier, billingCycle, couponCode } = await req.json();

        console.log('🐛 DEBUG: Received request data:', {
            amount,
            amountType: typeof amount,
            currency,
            tier,
            billingCycle,
            couponCode
        });

        // Validate required parameters
        if (!amount || amount <= 0) {
            console.log('🐛 DEBUG: Invalid amount validation failed');
            return NextResponse.json({ 
                error: "Invalid amount. Amount must be greater than 0",
                received: { amount, type: typeof amount }
            }, { status: 400 });
        }

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

        // Check if user already has an active subscription
        if (user.subscription && 
            user.subscription.tier !== 'free' && 
            ['active', 'trialing'].includes(user.subscription.status)) {
            return NextResponse.json({ 
                error: "User already has an active subscription",
                currentTier: user.subscription.tier,
                status: user.subscription.status
            }, { status: 400 });
        }

        const razorpay = getRazorpayInstance();

        // Generate unique receipt ID
        const receiptId = `leetfriends_${tier}_${billingCycle}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Determine if amount is already in paise or rupees
        let amountInPaise;
        
        // If amount is a large number (>1000), it's likely already in paise
        // If amount is small (<1000), it's likely in rupees and needs conversion
        if (amount >= 1000) {
            // Likely already in paise
            amountInPaise = Math.round(amount);
            console.log('🐛 DEBUG: Amount appears to be in paise already:', {
                received: amount,
                using: amountInPaise,
                inRupees: amountInPaise / 100
            });
        } else {
            // Likely in rupees, convert to paise
            amountInPaise = Math.round(amount * 100);
            console.log('🐛 DEBUG: Amount appears to be in rupees, converting:', {
                received: amount,
                converted: amountInPaise,
                formula: `${amount} * 100 = ${amountInPaise}`
            });
        }

        // Create order data
        const orderData = {
            amount: amountInPaise,
            currency: currency.toUpperCase(),
            receipt: receiptId,
            notes: {
                user_email: session.user.email,
                user_id: user._id?.toString() || '',
                tier: tier,
                billing_cycle: billingCycle,
                platform: 'leetfriends',
                user_name: user.name || session.user.name || '',
                ...(couponCode && { coupon_code: couponCode }),
                created_at: new Date().toISOString(),
                debug_original_amount: amount,
                debug_amount_in_paise: amountInPaise
            }
        };

        console.log('🐛 DEBUG: Creating Razorpay order with data:', {
            amount: orderData.amount,
            amountInRupees: orderData.amount / 100,
            currency: orderData.currency,
            receipt: orderData.receipt,
            originalAmount: amount
        });

        // Create order with Razorpay
        const order = await razorpay.orders.create(orderData);

        console.log('✅ Razorpay order created:', {
            id: order.id,
            amount: order.amount,
            amountInRupees: Number(order.amount) / 100,
            currency: order.currency,
            status: order.status
        });

        // Store order info in database for verification later
        await users.updateOne(
            { email: session.user.email },
            {
                $set: {
                    pendingOrder: {
                        razorpayOrderId: order.id,
                        amount: order.amount,
                        currency: order.currency,
                        receipt: order.receipt,
                        tier: tier,
                        billingCycle: billingCycle,
                        status: order.status,
                        originalAmountReceived: amount,
                        ...(couponCode && { couponCode }),
                        createdAt: new Date()
                    },
                    updatedAt: new Date()
                }
            }
        );

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
                status: order.status,
                created_at: order.created_at
            },
            // Additional data for frontend
            tierInfo: {
                tier,
                billingCycle,
                amountInRupees: Number(order.amount) / 100,
                originalAmountReceived: amount,
                ...(couponCode && { couponCode })
            },
            debug: {
                receivedAmount: amount,
                finalAmountInPaise: order.amount,
                finalAmountInRupees: Number(order.amount) / 100
            }
        });

    } catch (error: any) {
        console.error("🐛 DEBUG: Order creation error:", error);
        console.error("🐛 DEBUG: Error details:", {
            message: error.message,
            code: error.error?.code,
            description: error.error?.description,
            field: error.error?.field,
            reason: error.error?.reason,
            fullError: error
        });
        
        // Handle specific Razorpay errors
        if (error.error?.code) {
            return NextResponse.json({
                error: "Payment gateway error",
                details: error.error.description || "Failed to create order",
                code: error.error.code,
                debug: {
                    field: error.error.field,
                    reason: error.error.reason,
                    fullError: error.error
                }
            }, { status: 400 });
        }
        
        return NextResponse.json(
            { 
                error: "Internal server error",
                message: "Failed to create order. Please try again later.",
                debug: {
                    errorMessage: error.message,
                    errorType: error.constructor.name
                }
            }, 
            { status: 500 }
        );
    }
}