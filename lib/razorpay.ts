import Razorpay from 'razorpay';

// Lazy initialization to avoid build-time errors
let razorpayInstance: Razorpay | null = null;

export const getRazorpayInstance = (): Razorpay => {
    if (!razorpayInstance) {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        
        if (!keyId || !keySecret) {
            throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
        }
        
        razorpayInstance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
    }
    
    return razorpayInstance;
};

// For backwards compatibility, export as razorpay
export const razorpay = {
    get customers() {
        return getRazorpayInstance().customers;
    },
    get subscriptions() {
        return getRazorpayInstance().subscriptions;
    },
    get plans() {
        return getRazorpayInstance().plans;
    },
    get payments() {
        return getRazorpayInstance().payments;
    }
};

// Subscription plans configuration
export const RAZORPAY_PLANS = {
    silver_monthly: {
        id: process.env.RAZORPAY_SILVER_MONTHLY_PLAN_ID || '',
        amount: 6900, // ₹69.00 in paise
        currency: 'INR',
        interval: 1,
        period: 'monthly'
    },
    silver_yearly: {
        id: process.env.RAZORPAY_SILVER_YEARLY_PLAN_ID || '',
        amount: 66240, // ₹662.40 in paise (20% discount)
        currency: 'INR',
        interval: 1,
        period: 'yearly'
    },
    gold_monthly: {
        id: process.env.RAZORPAY_GOLD_MONTHLY_PLAN_ID || '',
        amount: 16900, // ₹169.00 in paise
        currency: 'INR',
        interval: 1,
        period: 'monthly'
    },
    gold_yearly: {
        id: process.env.RAZORPAY_GOLD_YEARLY_PLAN_ID || '',
        amount: 162240, // ₹1622.40 in paise (20% discount)
        currency: 'INR',
        interval: 1,
        period: 'yearly'
    }
};

export function getPlanKey(tier: string, billingCycle: string): string {
    return `${tier}_${billingCycle}` as keyof typeof RAZORPAY_PLANS;
}