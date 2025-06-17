import Razorpay from 'razorpay';

export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Subscription plans configuration
export const RAZORPAY_PLANS = {
    silver_monthly: {
        id: process.env.RAZORPAY_SILVER_MONTHLY_PLAN_ID!,
        amount: 6900, // ₹69.00 in paise
        currency: 'INR',
        interval: 1,
        period: 'monthly'
    },
    silver_yearly: {
        id: process.env.RAZORPAY_SILVER_YEARLY_PLAN_ID!,
        amount: 66240, // ₹662.40 in paise (20% discount)
        currency: 'INR',
        interval: 1,
        period: 'yearly'
    },
    gold_monthly: {
        id: process.env.RAZORPAY_GOLD_MONTHLY_PLAN_ID!,
        amount: 16900, // ₹169.00 in paise
        currency: 'INR',
        interval: 1,
        period: 'monthly'
    },
    gold_yearly: {
        id: process.env.RAZORPAY_GOLD_YEARLY_PLAN_ID!,
        amount: 162240, // ₹1622.40 in paise (20% discount)
        currency: 'INR',
        interval: 1,
        period: 'yearly'
    }
};

export function getPlanKey(tier: string, billingCycle: string): string {
    return `${tier}_${billingCycle}` as keyof typeof RAZORPAY_PLANS;
}