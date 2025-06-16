import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

const ADMIN_EMAILS = [
    'tarushagarwal2003@gmail.com',
    '07hardiksingla@gmail.com',
    
];

function isAdmin(email: string): boolean {
    return ADMIN_EMAILS.includes(email);
}

// GET - List all coupons (admin only)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || !isAdmin(session.user.email)) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const db = await connectToDatabase();
        const coupons = db.collection("coupons");
        
        const allCoupons = await coupons.find({}).sort({ createdAt: -1 }).toArray();
        
        return NextResponse.json({ coupons: allCoupons });

    } catch (error) {
        console.error("Coupon list error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create new coupon (admin only)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || !isAdmin(session.user.email)) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const {
            code,
            name,
            description,
            type,
            value,
            tier,
            maxUses,
            validFrom,
            validUntil,
            applicableTiers,
            applicableCycles
        } = await req.json();

        // Validation
        if (!code || !name || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const coupons = db.collection("coupons");

        // Check if code already exists
        const existingCoupon = await coupons.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
        }

        const newCoupon = {
            code: code.toUpperCase(),
            name,
            description,
            type,
            value: type === 'free_tier' ? 100 : value,
            tier: type === 'free_tier' ? tier : undefined,
            maxUses: maxUses || -1,
            usedCount: 0,
            validFrom: new Date(validFrom),
            validUntil: new Date(validUntil),
            isActive: true,
            applicableTiers: applicableTiers || ['silver', 'gold'],
            applicableCycles: applicableCycles || ['monthly', 'yearly'],
            createdBy: session.user.email,
            createdAt: new Date(),
            usedBy: []
        };

        const result = await coupons.insertOne(newCoupon);
        
        return NextResponse.json({ 
            success: true, 
            coupon: { ...newCoupon, _id: result.insertedId }
        });

    } catch (error) {
        console.error("Coupon creation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}