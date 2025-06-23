// components/PricingPage.tsx - Updated with coupon support
"use client";

import { motion } from "framer-motion";
import {
    ArrowLeft,
    Check,
    Code2,
    Crown,
    Sparkles,
    Star,
    Tag,
    Users,
    X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import CouponInput from "./CouponInput";
import RazorpayCheckout from "./RazorpayCheckout";

interface PricingTier {
    id: string;
    name: string;
    price: number;
    period: string;
    description: string;
    features: string[];
    limitations: string[];
    maxParties: number | string;
    popular?: boolean;
    icon: any;
    gradient: string;
    buttonColor: string;
}

const PRICING_TIERS: PricingTier[] = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        period: 'Forever',
        description: 'Perfect for getting started with LeetCode competition',
        features: [
            'Create up to 5 parties',
            'Join unlimited parties',
            'Basic progress tracking',
            'Party chat and challenges',
            'LeetCode stats sync',
            'Basic leaderboards'
        ],
        limitations: [
            'No AI insights',
            'No interview preparation',
            'Limited party creation'
        ],
        maxParties: 5,
        icon: Users,
        gradient: 'from-slate-600 to-slate-700',
        buttonColor: 'bg-slate-600 hover:bg-slate-700'
    },
    {
        id: 'silver',
        name: 'Silver',
        price: 69.00,
        period: 'month',
        description: 'Enhanced features for serious competitive programmers',
        features: [
            'Create up to 15 parties',
            'AI-powered insights',
            'Advanced analytics',
            'Personalized recommendations',
            'Problem difficulty suggestions',
            'Performance tracking',
            'Priority support',
            'All Free features'
        ],
        limitations: [
            'No interview preparation',
            'Limited advanced features'
        ],
        maxParties: 15,
        popular: true,
        icon: Star,
        gradient: 'from-purple-600 to-pink-600',
        buttonColor: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
    },
    {
        id: 'gold',
        name: 'Gold',
        price: 169.00,
        period: 'month',
        description: 'Complete package for interview preparation and mastery',
        features: [
            'Unlimited parties',
            'Full AI insights suite',
            'Interview preparation module',
            'Company-specific questions',
            'Mock interview sessions',
            'Advanced problem categorization',
            'Custom learning paths',
            '24/7 priority support',
            'All Silver features'
        ],
        limitations: [],
        maxParties: 'Unlimited',
        icon: Crown,
        gradient: 'from-yellow-500 to-orange-600',
        buttonColor: 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700'
    }
];

interface PricingPageProps {
    currentTier?: string;
    userEmail?: string;
}

export default function PricingPage({ currentTier = 'free', userEmail }: PricingPageProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [appliedCoupons, setAppliedCoupons] = useState<{ [key: string]: any }>({});
    const router = useRouter();

    const getYearlyPrice = (monthlyPrice: number) => {
        return +(monthlyPrice * 12 * 0.8).toFixed(2); // 20% discount for yearly, rounded to 2 decimals
    };

    const getDisplayPrice = (tier: PricingTier) => {
        if (tier.price === 0) return { amount: 0, period: 'Forever', originalAmount: 0 };
        
        const originalAmount = billingCycle === 'yearly'
            ? getYearlyPrice(tier.price)
            : tier.price;

        // Apply coupon discount if available
        const appliedCoupon = appliedCoupons[tier.id];
        if (appliedCoupon) {
            return {
                amount: appliedCoupon.discount.finalAmount / 100, // Convert from paise
                period: billingCycle === 'yearly' ? 'year' : tier.period,
                originalAmount: originalAmount,
                discount: appliedCoupon.discount.discountAmount / 100,
                discountPercentage: appliedCoupon.discount.discountPercentage,
                couponCode: appliedCoupon.coupon.code
            };
        }
        
        if (billingCycle === 'yearly') {
            return {
                amount: originalAmount,
                period: 'year',
                discount: '20% off',
                originalAmount: tier.price * 12
            };
        }
        
        return {
            amount: tier.price,
            period: tier.period,
            originalAmount: tier.price
        };
    };

    const handleCouponApplied = (tierIndex: string, couponData: any) => {
        setAppliedCoupons(prev => ({
            ...prev,
            [tierIndex]: couponData
        }));
    };

    const handleCouponRemoved = (tierIndex: string) => {
        setAppliedCoupons(prev => {
            const updated = { ...prev };
            delete updated[tierIndex];
            return updated;
        });
    };

    const handlePaymentSuccess = (data: any) => {
        console.log('Payment successful:', data);
        router.push('/dashboard?upgraded=true&tier=' + data.tier);
    };

    const handlePaymentError = (error: any) => {
        console.error('Payment failed:', error);
        setIsLoading(null);
    };

    const handleFreeSignup = () => {
        router.push('/login');
    };

    const handleFreeCouponUpgrade = async (tier: string) => {
        const appliedCoupon = appliedCoupons[tier];
        if (!appliedCoupon || appliedCoupon.discount.finalAmount > 0) {
            return; // Not a 100% off coupon
        }

        setIsLoading(tier);
        try {
            const response = await fetch('/api/coupons/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: appliedCoupon.coupon.code,
                    tier,
                    billingCycle
                })
            });

            const data = await response.json();
            if (response.ok && data.freeUpgrade) {
                toast.success('🎉 Subscription activated for free!');
                router.push('/dashboard?upgraded=true&tier=' + tier);
            } else {
                throw new Error(data.error || 'Failed to apply coupon');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 text-white">
            {/* Navigation */}
            <nav className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-950/80 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                onClick={() => router.back()}
                                className="text-slate-400 hover:text-white"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <div className="flex items-center space-x-2">
                                <Code2 className="w-6 h-6 text-purple-400" />
                                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                                    LeetFriends
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
                {/* Header */}
                <div className="text-center mb-12 lg:mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                            Choose Your{" "}
                            <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                                Coding Journey
                            </span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-8">
                            Unlock advanced features, AI insights, and interview preparation to accelerate your programming growth
                        </p>
                    </motion.div>

                    {/* Billing Toggle */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="flex items-center justify-center mb-8"
                    >
                        <div className="bg-slate-800/50 rounded-lg p-1 flex items-center">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    billingCycle === 'monthly'
                                        ? 'bg-purple-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
                                    billingCycle === 'yearly'
                                        ? 'bg-purple-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Yearly
                                <Badge className="absolute -top-2 -right-2 bg-green-500 text-xs px-1 py-0.5">
                                    20% off
                                </Badge>
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
                    {PRICING_TIERS.map((tier, index) => {
                        const displayPrice = getDisplayPrice(tier);
                        const isCurrentTier = currentTier === tier.id;
                        const isUpgrade = currentTier === 'free' && tier.id !== 'free';
                        const hasCoupon = appliedCoupons[tier.id];
                        const isFreeWithCoupon = hasCoupon && displayPrice.amount === 0;
                        
                        return (
                            <motion.div
                                key={tier.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className={`relative ${tier.popular ? 'lg:scale-105' : ''}`}
                            >
                                {tier.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1">
                                            <Sparkles className="w-3 h-3 mr-1" />
                                            Most Popular
                                        </Badge>
                                    </div>
                                )}

                                <Card className={`h-full relative overflow-hidden ${
                                    tier.popular 
                                        ? 'border-purple-500/50 bg-gradient-to-br from-slate-800/80 to-purple-900/20' 
                                        : 'bg-slate-800/50 border-slate-700/50'
                                } backdrop-blur-sm transition-all duration-300 hover:border-purple-500/30`}>
                                    <CardHeader className="text-center pb-8">
                                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${tier.gradient} flex items-center justify-center mx-auto mb-4`}>
                                            <tier.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <CardTitle className="text-2xl font-bold text-white mb-2">
                                            {tier.name}
                                        </CardTitle>
                                        <div className="space-y-2">
                                            <div className="flex items-baseline justify-center">
                                                {tier.id !== 'free' && displayPrice.originalAmount && displayPrice.originalAmount !== displayPrice.amount && (
                                                    <span className="text-lg text-slate-500 line-through mr-2">
                                                        ₹{displayPrice.originalAmount}
                                                    </span>
                                                )}
                                                <span className="text-4xl font-bold text-white">
                                                    ₹{displayPrice.amount}
                                                </span>
                                                {displayPrice.amount > 0 && (
                                                    <span className="text-slate-400 ml-2">
                                                        /{displayPrice.period}
                                                    </span>
                                                )}
                                            </div>
                                            {displayPrice.discount && (
                                                <Badge variant="outline" className="border-green-500/30 text-green-400">
                                                    {typeof displayPrice.discount === 'string' ? displayPrice.discount : `Save ₹${displayPrice.discount}`}
                                                </Badge>
                                            )}
                                            {displayPrice.couponCode && (
                                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                                    <Tag className="w-3 h-3 mr-1" />
                                                    {displayPrice.couponCode}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-slate-400 text-sm mt-4">
                                            {tier.description}
                                        </p>
                                    </CardHeader>

                                    <CardContent className="space-y-6">
                                        {/* Coupon Input for paid tiers */}
                                        {tier.id !== 'free' && (
                                            <CouponInput
                                                tier={tier.id as "silver" | "gold"}
                                                billingCycle={billingCycle}
                                                onCouponApplied={(data) => handleCouponApplied(tier.id, data)}
                                                onCouponRemoved={() => handleCouponRemoved(tier.id)}
                                                disabled={isLoading === tier.id}
                                            />
                                        )}

                                        {/* Key Feature */}
                                        <div className="text-center">
                                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium">
                                                <Users className="w-4 h-4 mr-2" />
                                                {tier.maxParties} parties max
                                            </div>
                                        </div>

                                        {/* Features */}
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-white text-sm">Features included:</h4>
                                            {tier.features.map((feature, idx) => (
                                                <div key={idx} className="flex items-start">
                                                    <Check className="w-4 h-4 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                                                    <span className="text-slate-300 text-sm">{feature}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Limitations */}
                                        {tier.limitations.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="font-semibold text-slate-400 text-sm">Limitations:</h4>
                                                {tier.limitations.map((limitation, idx) => (
                                                    <div key={idx} className="flex items-start">
                                                        <X className="w-4 h-4 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                                                        <span className="text-slate-400 text-sm">{limitation}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Action Button */}
                                        <div className="pt-4">
                                            {isCurrentTier ? (
                                                <Button
                                                    className="w-full bg-slate-600 hover:bg-slate-700 cursor-not-allowed"
                                                    disabled
                                                >
                                                    <Check className="w-4 h-4 mr-2" />
                                                    Current Plan
                                                </Button>
                                            ) : tier.id === 'free' ? (
                                                <Button
                                                    onClick={handleFreeSignup}
                                                    className={`w-full ${tier.buttonColor} transition-all duration-200`}
                                                >
                                                    <Users className="w-4 h-4 mr-2" />
                                                    Get Started Free
                                                </Button>
                                            ) : isFreeWithCoupon ? (
                                                <Button
                                                    onClick={() => handleFreeCouponUpgrade(tier.id)}
                                                    disabled={isLoading === tier.id}
                                                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                                                >
                                                    {isLoading === tier.id ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                            Activating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Crown className="w-4 h-4 mr-2" />
                                                            Activate Free
                                                        </>
                                                    )}
                                                </Button>
                                            ) : (
                                                <RazorpayCheckout
                                                    tier={tier.id as "silver" | "gold"}
                                                    billingCycle={billingCycle}
                                                    amount={displayPrice.amount * 100} // Convert to paise
                                                    onSuccess={handlePaymentSuccess}
                                                    onError={handlePaymentError}
                                                    disabled={isLoading === tier.id}
                                                >
                                                    <Crown className="w-4 h-4 mr-2" />
                                                    {isUpgrade ? 'Upgrade Now' : 'Get Started'}
                                                    {displayPrice.amount === 0 && ' - FREE'}
                                                </RazorpayCheckout>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Feature Comparison - Same as before */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mb-16"
                >
                    <h2 className="text-3xl font-bold text-center text-white mb-8">
                        Feature Comparison
                    </h2>
                    
                    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left py-4 px-6 text-white font-semibold">Features</th>
                                        <th className="text-center py-4 px-6 text-white font-semibold">Free</th>
                                        <th className="text-center py-4 px-6 text-white font-semibold">Silver</th>
                                        <th className="text-center py-4 px-6 text-white font-semibold">Gold</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    <tr>
                                        <td className="py-4 px-6 text-slate-300">Party Creation</td>
                                        <td className="py-4 px-6 text-center text-slate-400">Up to 5</td>
                                        <td className="py-4 px-6 text-center text-slate-300">Up to 15</td>
                                        <td className="py-4 px-6 text-center text-green-400">Unlimited</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 px-6 text-slate-300">Basic Progress Tracking</td>
                                        <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                                        <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                                        <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 px-6 text-slate-300">AI Insights & Recommendations</td>
                                        <td className="py-4 px-6 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                                        <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                                        <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 px-6 text-slate-300">Interview Preparation</td>
                                        <td className="py-4 px-6 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                                        <td className="py-4 px-6 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                                        <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 px-6 text-slate-300">Coupon Support</td>
                                        <td className="py-4 px-6 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                                        <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                                        <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </motion.div>

                {/* FAQ Section - Same as before */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="text-center"
                >
                    <h2 className="text-3xl font-bold text-white mb-8">
                        Frequently Asked Questions
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm text-left">
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-white mb-2">How do coupon codes work?</h3>
                                <p className="text-slate-400 text-sm">
                                    Enter your coupon code before checkout to get instant discounts. Some codes offer 100% off for free access!
                                </p>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm text-left">
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-white mb-2">Can I use multiple coupons?</h3>
                                <p className="text-slate-400 text-sm">
                                    Only one coupon can be applied per subscription. Choose the one that gives you the best discount!
                                </p>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm text-left">
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-white mb-2">Do coupons expire?</h3>
                                <p className="text-slate-400 text-sm">
                                    Yes, each coupon has an expiration date. Check with the person who gave you the code for validity.
                                </p>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm text-left">
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-white mb-2">Can I share coupon codes?</h3>
                                <p className="text-slate-400 text-sm">
                                    Some coupons are single-use, others can be shared. Check the terms when you receive your code.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <div className="mt-12">
                        <p className="text-slate-400 mb-6">
                            Still have questions? We're here to help!
                        </p>
                        <Button
                            variant="outline"
                            className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300"
                            onClick={() => router.push('/contact')}
                        >
                            Contact Support
                        </Button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}