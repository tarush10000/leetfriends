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

        const { code, tier, billingCycle } = await req.json();

        if (!code || !tier || !billingCycle) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const coupons = db.collection("coupons");

        const coupon = await coupons.findOne({
            code: code.toUpperCase(),
            isActive: true
        });

        if (!coupon) {
            return NextResponse.json({
                valid: false,
                error: "Invalid coupon code"
            });
        }

        // Check if coupon is expired
        const now = new Date();
        if (now < coupon.validFrom || now > coupon.validUntil) {
            return NextResponse.json({
                valid: false,
                error: "Coupon has expired"
            });
        }

        // Check usage limit
        if (coupon.maxUses !== -1 && coupon.usedCount >= coupon.maxUses) {
            return NextResponse.json({
                valid: false,
                error: "Coupon usage limit reached"
            });
        }

        // Check if user already used this coupon
        const alreadyUsed = coupon.usedBy?.some((usage: any) => usage.userEmail === session.user?.email);
        if (alreadyUsed) {
            return NextResponse.json({
                valid: false,
                error: "You have already used this coupon"
            });
        }

        // Check if coupon applies to selected tier
        if (!coupon.applicableTiers.includes(tier)) {
            return NextResponse.json({
                valid: false,
                error: `This coupon is not valid for ${tier} tier`
            });
        }

        // Check if coupon applies to selected billing cycle
        if (!coupon.applicableCycles.includes(billingCycle)) {
            return NextResponse.json({
                valid: false,
                error: `This coupon is not valid for ${billingCycle} billing`
            });
        }

        // Calculate discount
        let discountAmount = 0;
        const originalAmount = getOriginalAmount(tier, billingCycle);

        switch (coupon.type) {
            case 'percentage':
                discountAmount = Math.round((originalAmount * coupon.value) / 100);
                break;
            case 'fixed':
                discountAmount = Math.min(coupon.value, originalAmount);
                break;
            case 'free_tier':
                discountAmount = originalAmount; // 100% off
                break;
        }

        const finalAmount = Math.max(0, originalAmount - discountAmount);

        return NextResponse.json({
            valid: true,
            coupon: {
                code: coupon.code,
                name: coupon.name,
                description: coupon.description,
                type: coupon.type,
                value: coupon.value
            },
            discount: {
                originalAmount,
                discountAmount,
                finalAmount,
                discountPercentage: Math.round((discountAmount / originalAmount) * 100)
            }
        });

    } catch (error) {
        console.error("Coupon validation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

function getOriginalAmount(tier: string, billingCycle: string): number {
    const prices = {
        silver: { monthly: 69, yearly: 662.4 },
        gold: { monthly: 169, yearly: 1622.4 }
    };

    return prices[tier as keyof typeof prices]?.[billingCycle as keyof typeof prices.silver] || 0;
}