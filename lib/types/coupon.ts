// lib/types/coupon.ts - Coupon type definitions
export interface Coupon {
    _id?: string;
    code: string;
    name: string;
    description: string;
    type: 'percentage' | 'fixed' | 'free_tier';
    value: number; // 0-100 for percentage, amount in paise for fixed
    tier?: 'silver' | 'gold'; // For free_tier coupons
    maxUses: number; // -1 for unlimited
    usedCount: number;
    validFrom: Date;
    validUntil: Date;
    isActive: boolean;
    applicableTiers: ('silver' | 'gold')[];
    applicableCycles: ('monthly' | 'yearly')[];
    createdBy: string;
    createdAt: Date;
    usedBy: CouponUsage[];
}

export interface CouponUsage {
    userEmail: string;
    userName: string;
    usedAt: Date;
    tier: string;
    billingCycle: string;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
}