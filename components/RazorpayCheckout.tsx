"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, Loader2, AlertCircle, CheckCircle, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface RazorpayCheckoutProps {
    tier: string;
    billingCycle: string;
    amount: number;
    couponCode?: string; // Add coupon support
    originalAmount?: number; // Original amount before discount
    onSuccess: (data: any) => void;
    onError: (error: any) => void;
    disabled?: boolean;
    children: React.ReactNode;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function RazorpayCheckout({
    tier,
    billingCycle,
    amount,
    couponCode,
    originalAmount,
    onSuccess,
    onError,
    disabled = false,
    children
}: RazorpayCheckoutProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    // Load Razorpay script on component mount
    useEffect(() => {
        const loadRazorpayScript = async () => {
            if (window.Razorpay) {
                setScriptLoaded(true);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            
            script.onload = () => setScriptLoaded(true);
            script.onerror = () => {
                setError('Failed to load payment gateway');
                toast.error('Failed to load payment gateway');
            };
            
            document.body.appendChild(script);
        };

        loadRazorpayScript();
    }, []);

    const handlePayment = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔄 Starting payment process...', { 
                tier, 
                billingCycle, 
                amount, 
                couponCode,
                originalAmount 
            });

            if (!scriptLoaded) {
                throw new Error('Payment gateway not loaded');
            }

            // If amount is 0 (100% off coupon), handle as free upgrade
            if (amount === 0 && couponCode) {
                console.log('🎁 Processing 100% off coupon:', couponCode);
                
                try {
                    const couponResponse = await fetch('/api/coupons/apply', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            code: couponCode,
                            tier,
                            billingCycle
                        })
                    });

                    const couponData = await couponResponse.json();
                    
                    if (couponResponse.ok && couponData.freeUpgrade) {
                        onSuccess({
                            success: true,
                            tier,
                            freeUpgrade: true,
                            couponCode,
                            message: 'Subscription activated for free!'
                        });
                        toast.success('🎉 Subscription activated for free!');
                        return;
                    } else {
                        throw new Error(couponData.error || 'Failed to apply coupon');
                    }
                } catch (couponError: any) {
                    console.error('❌ Coupon application error:', couponError);
                    throw new Error('Failed to apply coupon: ' + couponError.message);
                }
            }

            // For paid subscriptions, create subscription with Razorpay
            const subscriptionPayload = {
                tier,
                billingCycle,
                ...(couponCode && { couponCode }), // Include coupon if present
                ...(originalAmount && { originalAmount }), // Include original amount if present
                finalAmount: amount // The final amount after discount
            };

            console.log('🚀 Creating subscription with payload:', subscriptionPayload);

            const response = await fetch('/api/payments/create-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscriptionPayload),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('❌ Subscription creation failed:', data);
                throw new Error(data.error || data.message || 'Failed to create subscription');
            }

            console.log('✅ Subscription created successfully:', data);

            // Prepare description with coupon info
            let description = `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan - ${billingCycle}`;
            if (couponCode && originalAmount && originalAmount > amount) {
                const discountAmount = originalAmount - amount;
                const discountPercentage = Math.round((discountAmount / originalAmount) * 100);
                description += ` (${discountPercentage}% off with ${couponCode})`;
            }

            // Configure Razorpay options
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                subscription_id: data.subscriptionId,
                name: 'LeetFriends',
                description,
                image: '/logo.png',
                currency: data.currency || 'INR',
                handler: async function (response: any) {
                    try {
                        setLoading(true);
                        console.log('💳 Payment completed, verifying...', response);
                        
                        // Verify payment with coupon information
                        const verifyPayload = {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_subscription_id: response.razorpay_subscription_id,
                            razorpay_signature: response.razorpay_signature,
                            ...(couponCode && { couponCode }), // Include coupon in verification
                            tier,
                            billingCycle
                        };

                        const verifyResponse = await fetch('/api/payments/verify-payment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(verifyPayload),
                        });

                        const verifyData = await verifyResponse.json();
                        console.log('🔐 Verification result:', verifyData);

                        if (verifyResponse.ok) {
                            // Add coupon information to success callback
                            const successData = {
                                ...verifyData,
                                couponCode,
                                originalAmount,
                                finalAmount: amount,
                                discountApplied: originalAmount && originalAmount > amount ? originalAmount - amount : 0
                            };
                            
                            onSuccess(successData);
                            
                            // Show success message with coupon info
                            if (couponCode && originalAmount && originalAmount > amount) {
                                const savings = originalAmount - amount;
                                toast.success(`🎉 Payment successful! You saved ₹${(savings / 100).toFixed(2)} with ${couponCode}!`);
                            } else {
                                toast.success('🎉 Payment successful! Your subscription is now active.');
                            }
                        } else {
                            throw new Error(verifyData.error || 'Payment verification failed');
                        }
                    } catch (error: any) {
                        console.error('❌ Payment verification error:', error);
                        onError(error);
                        toast.error('❌ Payment verification failed: ' + error.message);
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: '',
                    email: '',
                    contact: ''
                },
                notes: {
                    tier,
                    billing_cycle: billingCycle,
                    ...(couponCode && { coupon_code: couponCode }),
                    ...(originalAmount && { original_amount: originalAmount }),
                    final_amount: amount
                },
                theme: {
                    color: '#8B5CF6'
                },
                modal: {
                    ondismiss: function() {
                        setLoading(false);
                        toast.info('Payment cancelled');
                    },
                    confirm_close: true,
                    escape: true,
                    animation: true
                },
                recurring: 1,
                subscription_card_change: 1,
                remember_customer: false,
                retry: {
                    enabled: true,
                    max_count: 4
                },
                timeout: 300 // 5 minutes timeout
            };

            console.log('🎯 Opening Razorpay checkout with options:', {
                ...options,
                key: '***masked***' // Don't log the actual key
            });

            const rzp = new window.Razorpay(options);
            
            rzp.on('payment.failed', function (response: any) {
                setLoading(false);
                const errorMessage = response.error?.description || 'Payment failed';
                console.error('💥 Payment failed:', response.error);
                setError(errorMessage);
                toast.error('❌ ' + errorMessage);
                onError(new Error(errorMessage));
            });

            rzp.open();

        } catch (error: any) {
            console.error('🚨 Payment initiation error:', error);
            setError(error.message);
            onError(error);
            toast.error('❌ ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="space-y-3">
                <div className="relative w-full rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm">
                    <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="text-red-300">
                            {error}
                        </div>
                    </div>
                </div>
                <Button
                    onClick={() => {
                        setError(null);
                        handlePayment();
                    }}
                    className="w-full"
                    variant="outline"
                >
                    Try Again
                </Button>
            </div>
        );
    }

    // Special styling for free (100% off) upgrades
    const isFree = amount === 0;
    const hasDiscount = originalAmount && originalAmount > amount;

    return (
        <div className="space-y-2">
            {/* Show discount info if applicable */}
            {hasDiscount && !isFree && (
                <div className="text-center text-sm">
                    <div className="inline-flex items-center px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                        <Tag className="w-3 h-3 mr-1" />
                        <span className="line-through text-slate-400 mr-2">
                            ₹{(originalAmount! / 100).toFixed(2)}
                        </span>
                        <span className="font-semibold">
                            ₹{(amount / 100).toFixed(2)}
                        </span>
                    </div>
                </div>
            )}

            <Button
                onClick={handlePayment}
                disabled={disabled || loading || !scriptLoaded}
                className={`w-full ${
                    isFree 
                        ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                        : hasDiscount 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border border-green-500/30' 
                        : ''
                }`}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isFree ? 'Activating...' : 'Processing...'}
                    </>
                ) : !scriptLoaded ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                    </>
                ) : (
                    <>
                        {children}
                        {isFree && (
                            <span className="ml-2 text-xs bg-green-800/50 px-2 py-0.5 rounded-full">
                                FREE
                            </span>
                        )}
                        {hasDiscount && !isFree && couponCode && (
                            <span className="ml-2 text-xs bg-green-800/50 px-2 py-0.5 rounded-full">
                                {couponCode}
                            </span>
                        )}
                    </>
                )}
            </Button>

            {/* Show savings info */}
            {hasDiscount && (
                <div className="text-center text-xs text-green-400">
                    {isFree ? (
                        `You save ₹${(originalAmount! / 100).toFixed(2)} with ${couponCode}!`
                    ) : (
                        `You save ₹${((originalAmount! - amount) / 100).toFixed(2)} with ${couponCode}!`
                    )}
                </div>
            )}
        </div>
    );
}