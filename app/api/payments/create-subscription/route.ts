import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { razorpay, RAZORPAY_PLANS, getPlanKey } from "@/lib/razorpay";

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

        const planKey = getPlanKey(tier, billingCycle);
        const plan = RAZORPAY_PLANS[planKey as keyof typeof RAZORPAY_PLANS];

        if (!plan) {
            return NextResponse.json({ error: "Plan not found" }, { status: 400 });
        }

        let customerId = user.razorpayCustomerId;

        // Create or update customer
        try {
            if (!customerId) {
                const customer = await razorpay.customers.create({
                    name: user.name || session.user.name!,
                    email: session.user.email,
                    contact: user.phone || '',
                    notes: {
                        user_id: user._id?.toString() || '',
                        platform: 'leetfriends',
                        signup_date: user.createdAt?.toISOString() || new Date().toISOString()
                    }
                });

                customerId = customer.id;

                // Update user with customer ID
                await users.updateOne(
                    { email: session.user.email },
                    { 
                        $set: { 
                            razorpayCustomerId: customerId,
                            updatedAt: new Date()
                        } 
                    }
                );
            } else {
                // Update existing customer info
                await razorpay.customers.edit(customerId, {
                    name: user.name || session.user.name!,
                    email: session.user.email,
                    contact: user.phone || ''
                });
            }
        } catch (customerError) {
            console.error("Customer creation/update error:", customerError);
            return NextResponse.json({ 
                error: "Failed to create/update customer" 
            }, { status: 500 });
        }

        // Calculate subscription timing
        const now = Math.floor(Date.now() / 1000);
        const startAt = now + 60; // Start 1 minute from now
        const expireBy = now + (30 * 60); // Expire in 30 minutes

        // Create subscription with correct Razorpay parameters
        const subscriptionData = {
            plan_id: plan.id,
            customer_id: customerId,
            total_count: billingCycle === 'yearly' ? 10 : 120, // 10 years for yearly, 120 months for monthly
            quantity: 1,
            customer_notify: true,
            start_at: startAt,
            expire_by: expireBy,
            notes: {
                user_email: session.user.email,
                user_id: user._id?.toString() || '',
                tier: tier,
                billing_cycle: billingCycle,
                platform: 'leetfriends',
                user_name: user.name || session.user.name || '',
                upgrade_timestamp: new Date().toISOString()
            }
        };

        let subscription;
        try {
            subscription = await razorpay.subscriptions.create(subscriptionData);
        } catch (subscriptionError: any) {
            console.error("Subscription creation error:", subscriptionError);
            
            // Handle specific Razorpay errors
            if (subscriptionError.error?.code === 'BAD_REQUEST_ERROR') {
                return NextResponse.json({ 
                    error: "Invalid subscription parameters",
                    details: subscriptionError.error.description
                }, { status: 400 });
            }
            
            return NextResponse.json({ 
                error: "Failed to create subscription" 
            }, { status: 500 });
        }

        // Store subscription info in database
        await users.updateOne(
            { email: session.user.email },
            {
                $set: {
                    pendingSubscription: {
                        razorpaySubscriptionId: subscription.id,
                        tier: tier,
                        billingCycle: billingCycle,
                        amount: plan.amount,
                        currency: plan.currency,
                        status: subscription.status,
                        startAt: subscription.start_at,
                        expireBy: subscription.expire_by,
                        chargeAt: subscription.charge_at,
                        shortUrl: subscription.short_url,
                        createdAt: new Date()
                    },
                    updatedAt: new Date()
                }
            }
        );

        return NextResponse.json({
            success: true,
            subscriptionId: subscription.id,
            customerId: customerId,
            planId: plan.id,
            amount: plan.amount,
            currency: plan.currency,
            shortUrl: subscription.short_url,
            status: subscription.status,
            startAt: subscription.start_at,
            expireBy: subscription.expire_by,
            chargeAt: subscription.charge_at,
            totalCount: subscription.total_count,
            remainingCount: subscription.remaining_count
        });

    } catch (error) {
        console.error("Subscription creation error:", error);
        return NextResponse.json(
            { 
                error: "Internal server error",
                message: "Failed to create subscription. Please try again later."
            }, 
            { status: 500 }
        );
    }
}