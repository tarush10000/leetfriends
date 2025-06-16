// lib/subscription.ts - Complete subscription utility functions

export interface SubscriptionTier {
    name: string;
    level: 'free' | 'silver' | 'gold';
    maxParties: number;
    hasAIInsights: boolean;
    hasInterviewPrep: boolean;
    monthlyPrice: number;
    yearlyPrice: number;
    color: string;
    icon: string;
}

export interface UserSubscription {
    tier: 'free' | 'silver' | 'gold';
    status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'trial_expired';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    razorpaySubscriptionId?: string;
    razorpayPaymentId?: string;
    razorpayCustomerId?: string;
    billingCycle?: 'monthly' | 'yearly';
    trialEnd?: Date;
}

export const SUBSCRIPTION_TIERS = {
    free: {
        name: 'Free',
        level: 'free' as const,
        maxParties: 5,
        hasAIInsights: false,
        hasInterviewPrep: false,
        monthlyPrice: 0,
        yearlyPrice: 0,
        color: 'text-slate-400',
        icon: 'Users'
    },
    silver: {
        name: 'Silver',
        level: 'silver' as const,
        maxParties: 15,
        hasAIInsights: true,
        hasInterviewPrep: false,
        monthlyPrice: 69.00,
        yearlyPrice: 95.90, // 20% discount
        color: 'text-slate-300',
        icon: 'Star'
    },
    gold: {
        name: 'Gold',
        level: 'gold' as const,
        maxParties: -1, // unlimited
        hasAIInsights: true,
        hasInterviewPrep: true,
        monthlyPrice: 169.00,
        yearlyPrice: 191.90, // 20% discount
        color: 'text-yellow-400',
        icon: 'Crown'
    }
};

/**
 * Check if a user can access a specific feature based on their subscription tier
 */
export function canUserAccessFeature(userTier: string, feature: 'insights' | 'interview-prep'): boolean {
    const tier = SUBSCRIPTION_TIERS[userTier as keyof typeof SUBSCRIPTION_TIERS] || SUBSCRIPTION_TIERS.free;
    
    switch (feature) {
        case 'insights':
            return tier.hasAIInsights;
        case 'interview-prep':
            return tier.hasInterviewPrep;
        default:
            return false;
    }
}

/**
 * Check if a user can create more parties based on their subscription tier and current count
 */
export function canUserCreateParty(userTier: string, currentPartyCount: number): boolean {
    const tier = SUBSCRIPTION_TIERS[userTier as keyof typeof SUBSCRIPTION_TIERS] || SUBSCRIPTION_TIERS.free;
    
    if (tier.maxParties === -1) return true; // unlimited
    return currentPartyCount < tier.maxParties;
}

/**
 * Get the subscription tier limits and features for a user
 */
export function getUserTierLimits(userTier: string): SubscriptionTier {
    return SUBSCRIPTION_TIERS[userTier as keyof typeof SUBSCRIPTION_TIERS] || SUBSCRIPTION_TIERS.free;
}

/**
 * Check if a subscription is currently active
 */
export function isSubscriptionActive(subscription: UserSubscription): boolean {
    if (!subscription) return false;
    
    const now = new Date();
    const activeStatuses = ['active', 'trialing'];
    
    return (
        activeStatuses.includes(subscription.status) &&
        new Date(subscription.currentPeriodEnd) > now
    );
}

/**
 * Check if a subscription is in trial period
 */
export function isSubscriptionInTrial(subscription: UserSubscription): boolean {
    if (!subscription || !subscription.trialEnd) return false;
    
    const now = new Date();
    return (
        subscription.status === 'trialing' &&
        new Date(subscription.trialEnd) > now
    );
}

/**
 * Get days remaining in trial period
 */
export function getTrialDaysRemaining(subscription: UserSubscription): number {
    if (!isSubscriptionInTrial(subscription) || !subscription.trialEnd) return 0;
    
    const now = new Date();
    const trialEnd = new Date(subscription.trialEnd);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
}

/**
 * Get days until subscription renewal
 */
export function getDaysUntilRenewal(subscription: UserSubscription): number {
    if (!subscription || !subscription.currentPeriodEnd) return 0;
    
    const now = new Date();
    const renewalDate = new Date(subscription.currentPeriodEnd);
    const diffTime = renewalDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
}

/**
 * Calculate the total savings when choosing yearly billing
 */
export function calculateYearlySavings(tier: 'silver' | 'gold'): number {
    const tierData = SUBSCRIPTION_TIERS[tier];
    const monthlyTotal = tierData.monthlyPrice * 12;
    const yearlyPrice = tierData.yearlyPrice;
    
    return monthlyTotal - yearlyPrice;
}

/**
 * Get upgrade path from current tier to target tier
 */
export function getUpgradePath(currentTier: string, targetTier: string): {
    canUpgrade: boolean;
    requiredTier: string;
    features: string[];
} {
    const current = SUBSCRIPTION_TIERS[currentTier as keyof typeof SUBSCRIPTION_TIERS] || SUBSCRIPTION_TIERS.free;
    const target = SUBSCRIPTION_TIERS[targetTier as keyof typeof SUBSCRIPTION_TIERS];
    
    if (!target) {
        return {
            canUpgrade: false,
            requiredTier: currentTier,
            features: []
        };
    }
    
    const tierOrder = { free: 0, silver: 1, gold: 2 };
    const canUpgrade = tierOrder[current.level] < tierOrder[target.level];
    
    const features = [];
    if (target.hasAIInsights && !current.hasAIInsights) {
        features.push('AI Insights & Recommendations');
    }
    if (target.hasInterviewPrep && !current.hasInterviewPrep) {
        features.push('Interview Preparation');
    }
    if (target.maxParties === -1 && current.maxParties !== -1) {
        features.push('Unlimited Parties');
    } else if (target.maxParties > current.maxParties) {
        features.push(`Increased Party Limit (${target.maxParties})`);
    }
    
    return {
        canUpgrade,
        requiredTier: target.level,
        features
    };
}

/**
 * Format subscription status for display
 */
export function formatSubscriptionStatus(subscription: UserSubscription): {
    status: string;
    color: string;
    description: string;
} {
    if (!subscription) {
        return {
            status: 'No Subscription',
            color: 'text-slate-400',
            description: 'Free tier active'
        };
    }
    
    switch (subscription.status) {
        case 'active':
            return {
                status: 'Active',
                color: 'text-green-400',
                description: isSubscriptionInTrial(subscription) 
                    ? `Trial active (${getTrialDaysRemaining(subscription)} days left)`
                    : `Renews in ${getDaysUntilRenewal(subscription)} days`
            };
        case 'trialing':
            return {
                status: 'Trial',
                color: 'text-blue-400',
                description: `${getTrialDaysRemaining(subscription)} days remaining`
            };
        case 'canceled':
            return {
                status: 'Canceled',
                color: 'text-orange-400',
                description: subscription.cancelAtPeriodEnd 
                    ? `Active until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : 'Canceled'
            };
        case 'past_due':
            return {
                status: 'Payment Failed',
                color: 'text-red-400',
                description: 'Please update your payment method'
            };
        case 'trial_expired':
            return {
                status: 'Trial Expired',
                color: 'text-red-400',
                description: 'Upgrade to continue using premium features'
            };
        default:
            return {
                status: 'Unknown',
                color: 'text-slate-400',
                description: 'Contact support for assistance'
            };
    }
}

/**
 * Get feature comparison between tiers
 */
export function getFeatureComparison(): {
    feature: string;
    free: boolean | string;
    silver: boolean | string;
    gold: boolean | string;
}[] {
    return [
        {
            feature: 'Party Creation',
            free: 'Up to 5',
            silver: 'Up to 15',
            gold: 'Unlimited'
        },
        {
            feature: 'Join Parties',
            free: true,
            silver: true,
            gold: true
        },
        {
            feature: 'Basic Progress Tracking',
            free: true,
            silver: true,
            gold: true
        },
        {
            feature: 'Party Chat & Challenges',
            free: true,
            silver: true,
            gold: true
        },
        {
            feature: 'LeetCode Stats Sync',
            free: true,
            silver: true,
            gold: true
        },
        {
            feature: 'AI Insights & Recommendations',
            free: false,
            silver: true,
            gold: true
        },
        {
            feature: 'Advanced Analytics',
            free: false,
            silver: true,
            gold: true
        },
        {
            feature: 'Interview Preparation',
            free: false,
            silver: false,
            gold: true
        },
        {
            feature: 'Company-Specific Questions',
            free: false,
            silver: false,
            gold: true
        },
        {
            feature: 'Priority Support',
            free: false,
            silver: true,
            gold: true
        },
        {
            feature: '24/7 Support',
            free: false,
            silver: false,
            gold: true
        }
    ];
}

/**
 * Validate subscription data
 */
export function validateSubscription(subscription: any): UserSubscription | null {
    if (!subscription || typeof subscription !== 'object') {
        return null;
    }
    
    const validTiers = ['free', 'silver', 'gold'];
    const validStatuses = ['active', 'canceled', 'past_due', 'trialing', 'trial_expired'];
    
    if (!validTiers.includes(subscription.tier) || !validStatuses.includes(subscription.status)) {
        return null;
    }
    
    return {
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.currentPeriodStart),
        currentPeriodEnd: new Date(subscription.currentPeriodEnd),
        cancelAtPeriodEnd: Boolean(subscription.cancelAtPeriodEnd),
        razorpaySubscriptionId: subscription.razorpaySubscriptionId,
        razorpayPaymentId: subscription.razorpayPaymentId,
        razorpayCustomerId: subscription.razorpayCustomerId,
        billingCycle: subscription.billingCycle,
        trialEnd: subscription.trialEnd ? new Date(subscription.trialEnd) : undefined
    };
}

/**
 * Create default free subscription for new users
 */
export function createDefaultSubscription(): UserSubscription {
    const now = new Date();
    const farFuture = new Date('2099-12-31');
    
    return {
        tier: 'free',
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: farFuture,
        cancelAtPeriodEnd: false
    };
}

/**
 * Check if user should see upgrade prompts
 */
export function shouldShowUpgradePrompt(userTier: string, feature?: string): boolean {
    if (userTier !== 'free') return false;
    
    if (feature) {
        return !canUserAccessFeature(userTier, feature as 'insights' | 'interview-prep');
    }
    
    return true;
}

/**
 * Get recommended tier for a user based on usage
 */
export function getRecommendedTier(partyCount: number, wantsAI: boolean, wantsInterview: boolean): 'free' | 'silver' | 'gold' {
    if (wantsInterview) return 'gold';
    if (wantsAI || partyCount >= 10) return 'silver';
    if (partyCount >= 5) return 'silver';
    return 'free';
}

/**
 * Calculate proration amount for mid-cycle upgrades
 */
export function calculateProration(
    currentTier: string,
    targetTier: string,
    daysRemaining: number,
    billingCycle: 'monthly' | 'yearly' = 'monthly'
): number {
    const current = SUBSCRIPTION_TIERS[currentTier as keyof typeof SUBSCRIPTION_TIERS];
    const target = SUBSCRIPTION_TIERS[targetTier as keyof typeof SUBSCRIPTION_TIERS];
    
    if (!current || !target) return 0;
    
    const currentPrice = billingCycle === 'yearly' ? current.yearlyPrice : current.monthlyPrice;
    const targetPrice = billingCycle === 'yearly' ? target.yearlyPrice : target.monthlyPrice;
    
    const priceDiff = targetPrice - currentPrice;
    const totalDays = billingCycle === 'yearly' ? 365 : 30;
    
    return (priceDiff * daysRemaining) / totalDays;
}

export default {
    SUBSCRIPTION_TIERS,
    canUserAccessFeature,
    canUserCreateParty,
    getUserTierLimits,
    isSubscriptionActive,
    isSubscriptionInTrial,
    getTrialDaysRemaining,
    getDaysUntilRenewal,
    calculateYearlySavings,
    getUpgradePath,
    formatSubscriptionStatus,
    getFeatureComparison,
    validateSubscription,
    createDefaultSubscription,
    shouldShowUpgradePrompt,
    getRecommendedTier,
    calculateProration
};