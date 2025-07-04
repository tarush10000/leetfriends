// Replace the contents of app/api/payments/create-order/route.ts with this fixed version

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getRazorpayInstance } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
    try {
        console.log('🚀 Create order endpoint called');
        
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            console.log('❌ Unauthorized access attempt');
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log('✅ User authenticated:', session.user.email);

        const { amount, currency = "INR", tier, billingCycle, couponCode } = await req.json();

        console.log('📝 Request payload:', {
            amount,
            amountType: typeof amount,
            currency,
            tier,
            billingCycle,
            couponCode,
            userEmail: session.user.email
        });

        // Validate required parameters
        if (!amount || amount <= 0) {
            console.log('❌ Invalid amount validation failed');
            return NextResponse.json({ 
                error: "Invalid amount. Amount must be greater than 0",
                received: { amount, type: typeof amount }
            }, { status: 400 });
        }

        if (!['silver', 'gold'].includes(tier)) {
            console.log('❌ Invalid tier:', tier);
            return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
        }

        if (!['monthly', 'yearly'].includes(billingCycle)) {
            console.log('❌ Invalid billing cycle:', billingCycle);
            return NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 });
        }

        console.log('✅ Request validation passed');

        // Connect to database
        console.log('📊 Connecting to database...');
        const db = await connectToDatabase();
        const users = db.collection("users");
        
        // Get current user
        const user = await users.findOne({ email: session.user.email });
        if (!user) {
            console.log('❌ User not found in database');
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        console.log('✅ User found in database');

        // Check if user already has an active subscription
        if (user.subscription && 
            user.subscription.tier !== 'free' && 
            ['active', 'trialing'].includes(user.subscription.status)) {
            console.log('❌ User already has active subscription:', user.subscription);
            return NextResponse.json({ 
                error: "User already has an active subscription",
                currentTier: user.subscription.tier,
                status: user.subscription.status
            }, { status: 400 });
        }

        console.log('✅ User subscription check passed');

        // Initialize Razorpay
        console.log('🔧 Initializing Razorpay...');
        let razorpay;
        try {
            razorpay = getRazorpayInstance();
            console.log('✅ Razorpay instance created successfully');
        } catch (razorpayError) {
            console.error('❌ Failed to initialize Razorpay:', razorpayError);
            return NextResponse.json({
                error: "Payment gateway configuration error",
                details: (razorpayError as Error)?.message || String(razorpayError),
                code: 'RAZORPAY_INIT_ERROR'
            }, { status: 500 });
        }

        // Generate unique receipt ID (max 40 characters for Razorpay)
        const timestamp = Date.now().toString().slice(-8); // Last 8 digits
        const randomId = Math.random().toString(36).substr(2, 6); // 6 char random
        const tierCode = tier.substring(0, 1); // s for silver, g for gold
        const cycleCode = billingCycle.substring(0, 1); // m for monthly, y for yearly
        const receiptId = `lf_${tierCode}${cycleCode}_${timestamp}_${randomId}`; // ~25 chars

        // Convert amount to paise (Razorpay expects amount in smallest currency unit)
        // Frontend should send amount in paise (₹69.00 = 6900 paise)
        const amountInPaise = Math.round(amount); // Amount is already in paise

        console.log('💰 Amount calculation:', {
            receivedAmount: amount,
            convertedToPaise: amountInPaise,
            formula: `${amount} × 100 = ${amountInPaise}`,
            amountInRupees: amountInPaise / 100
        });

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

        console.log('📦 Creating Razorpay order with data:', {
            amount: orderData.amount,
            amountInRupees: orderData.amount / 100,
            currency: orderData.currency,
            receipt: orderData.receipt,
            userEmail: orderData.notes.user_email
        });

        // Create order with Razorpay
        let order;
        try {
            order = await razorpay.orders.create(orderData);
            console.log('✅ Razorpay order created successfully:', {
                id: order.id,
                amount: order.amount,
                amountInRupees: Number(order.amount) / 100,
                currency: order.currency,
                status: order.status,
                receipt: order.receipt
            });
        } catch (razorpayOrderError) {
            console.error('❌ Razorpay order creation failed:', razorpayOrderError);
            
            // Log detailed error information
            const err = razorpayOrderError as any;
            console.error('🔍 Detailed Razorpay error:', {
                message: err?.message,
                code: err?.error?.code,
                description: err?.error?.description,
                field: err?.error?.field,
                reason: err?.error?.reason,
                source: err?.error?.source,
                step: err?.error?.step,
                fullError: err
            });

            if ((err?.error?.code)) {
                return NextResponse.json({
                    error: "Payment gateway error",
                    details: err?.error?.description || "Authentication failed",
                    code: err?.error?.code,
                    debug: {
                        field: err?.error?.field,
                        reason: err?.error?.reason,
                        source: err?.error?.source,
                        step: err?.error?.step
                    }
                }, { status: 400 });
            }

            return NextResponse.json({
                error: "Payment gateway error",
                details: "Failed to create order with payment gateway",
                debug: {
                    errorMessage: err?.message,
                    errorType: err?.constructor?.name
                }
            }, { status: 500 });
        }

        // Store order info in database for verification later
        console.log('💾 Storing order information in database...');
        try {
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
            console.log('✅ Order information stored in database');
        } catch (dbError) {
            console.error('❌ Failed to store order in database:', dbError);
            // Don't fail the entire request if database storage fails
        }

        // Return success response
        console.log('🎉 Order creation completed successfully');
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
        console.error("🐛 Unexpected error in create-order:", error);
        
        return NextResponse.json({
            error: "Internal server error",
            message: "An unexpected error occurred. Please try again later.",
            debug: {
                errorMessage: error.message,
                errorType: error.constructor.name,
                stack: error.stack
            }
        }, { status: 500 });
    }
}