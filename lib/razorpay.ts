// Replace the contents of lib/razorpay.ts with this fixed version

import Razorpay from 'razorpay';

// Direct initialization instead of lazy loading
const initializeRazorpay = () => {
    // Get environment variables directly
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    console.log('🔧 Initializing Razorpay with:', {
        keyId: keyId ? `${keyId.substring(0, 15)}...` : 'NOT SET',
        keySecret: keySecret ? `${keySecret.substring(0, 4)}...` : 'NOT SET',
        keyIdExists: !!keyId,
        keySecretExists: !!keySecret
    });
    
    if (!keyId || !keySecret) {
        throw new Error(`Razorpay credentials not configured properly:
        - RAZORPAY_KEY_ID: ${keyId ? 'SET' : 'NOT SET'}
        - RAZORPAY_KEY_SECRET: ${keySecret ? 'SET' : 'NOT SET'}
        
        Please check your .env.local file and restart your server.`);
    }
    
    try {
        const instance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
        
        console.log('✅ Razorpay instance created successfully');
        return instance;
    } catch (error) {
        console.error('❌ Failed to create Razorpay instance:', error);
        throw error;
    }
};

// Create a single instance
let razorpayInstance: Razorpay | null = null;

export const getRazorpayInstance = (): Razorpay => {
    if (!razorpayInstance) {
        razorpayInstance = initializeRazorpay();
    }
    return razorpayInstance;
};

// Test function to verify credentials
export const testRazorpayCredentials = async () => {
    try {
        const razorpay = getRazorpayInstance();
        
        // Try to create a minimal test order
        const testOrder = await razorpay.orders.create({
            amount: 100, // ₹1.00 in paise
            currency: 'INR',
            receipt: 'test_receipt_' + Date.now(),
            notes: {
                purpose: 'Credential test'
            }
        });
        
        console.log('✅ Razorpay credentials test passed:', testOrder.id);
        return { success: true, orderId: testOrder.id };
    } catch (error) {
        console.error('❌ Razorpay credentials test failed:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
        };
    }
};

// For backwards compatibility
export const razorpay = {
    get orders() {
        return getRazorpayInstance().orders;
    },
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
        amount: 69.00,
        currency: 'INR',
        interval: 1,
        period: 'monthly'
    },
    silver_yearly: {
        id: process.env.RAZORPAY_SILVER_YEARLY_PLAN_ID || '',
        amount: 662.40,
        currency: 'INR',
        interval: 1,
        period: 'yearly'
    },
    gold_monthly: {
        id: process.env.RAZORPAY_GOLD_MONTHLY_PLAN_ID || '',
        amount: 169.00,
        currency: 'INR',
        interval: 1,
        period: 'monthly'
    },
    gold_yearly: {
        id: process.env.RAZORPAY_GOLD_YEARLY_PLAN_ID || '',
        amount: 1622.40,
        currency: 'INR',
        interval: 1,
        period: 'yearly'
    }
};

export function getPlanKey(tier: string, billingCycle: string): string {
    return `${tier}_${billingCycle}` as keyof typeof RAZORPAY_PLANS;
}