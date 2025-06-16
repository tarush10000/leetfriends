import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { code, tier, billingCycle } = await req.json();

        // First validate the coupon
        const validateResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/coupons/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, tier, billingCycle })
        });

        const validation = await validateResponse.json();
        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const db = await connectToDatabase();
        const coupons = db.collection("coupons");
        const users = db.collection("users");

        // If it's a 100% off coupon (free_tier), directly upgrade user
        if (validation.coupon.type === 'free_tier' || validation.discount.finalAmount === 0) {
            // Upgrade user directly without payment
            const now = new Date();
            const periodEnd = new Date(now);
            
            if (billingCycle === 'monthly') {
                periodEnd.setMonth(periodEnd.getMonth() + 1);
            } else {
                periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            }

            await users.updateOne(
                { email: session.user.email },
                {
                    $set: {
                        subscription: {
                            tier: tier,
                            status: 'active',
                            currentPeriodStart: now,
                            currentPeriodEnd: periodEnd,
                            cancelAtPeriodEnd: false,
                            billingCycle: billingCycle,
                            couponUsed: validation.coupon.code
                        },
                        updatedAt: now
                    }
                }
            );

            // Mark coupon as used - Fix the type issues here
            await coupons.updateOne(
                { code: code.toUpperCase() },
                {
                    $inc: { usedCount: 1 },
                    $push: {
                        usedBy: {
                            userEmail: session.user.email,
                            userName: session.user.name || 'Unknown User', // Handle null/undefined
                            usedAt: now,
                            tier: tier as string, // Explicit type casting
                            billingCycle: billingCycle as string,
                            originalAmount: validation.discount.originalAmount as number,
                            discountAmount: validation.discount.discountAmount as number,
                            finalAmount: validation.discount.finalAmount as number
                        }
                    } as any
                }
            );

            return NextResponse.json({
                success: true,
                message: "Subscription activated successfully with coupon!",
                tier,
                freeUpgrade: true
            });
        }

        // For partial discounts, return modified amount for payment processing
        return NextResponse.json({
            success: true,
            discount: validation.discount,
            proceedToPayment: true
        });

    } catch (error) {
        console.error("Coupon application error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}