// components/RazorpayCheckout.tsx - Fixed to follow Razorpay documentation
"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RazorpayCheckoutProps {
    tier: 'silver' | 'gold';
    billingCycle: 'monthly' | 'yearly';
    amount: number; // Amount in rupees
    couponCode?: string;
    originalAmount?: number;
    onSuccess: (data: any) => void;
    onError: (error: any) => void;
    disabled?: boolean;
    children: React.ReactNode | ((props: { loading: boolean; isFree: boolean }) => React.ReactNode);
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

            // Step 1: Create Order (according to Razorpay docs)
            console.log('📝 Creating order...');

            const orderPayload = {
                amount, // Amount should be in rupees here, API will convert to paise
                currency: 'INR',
                tier,
                billingCycle,
                ...(couponCode && { couponCode })
            };

            console.log('Order payload being sent:', {
                ...orderPayload,
                amountNote: `₹${amount} (will be converted to ${amount * 100} paise by API)`
            });

            const orderResponse = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderPayload),
            });

            const orderData = await orderResponse.json();

            if (!orderResponse.ok) {
                console.error('❌ Order creation failed:', orderData);
                throw new Error(orderData.error || orderData.message || 'Failed to create order');
            }

            console.log('✅ Order created successfully:', orderData.order);

            // Step 2: Prepare Checkout Options (according to Razorpay docs)
            let description = `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan - ${billingCycle}`;
            if (couponCode && originalAmount && originalAmount > amount) {
                const discountAmount = originalAmount - amount;
                const discountPercentage = Math.round((discountAmount / originalAmount) * 100);
                description += ` (${discountPercentage}% off with ${couponCode})`;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.order.amount, // Amount in paise from order
                currency: orderData.order.currency,
                name: 'LeetFriends',
                description,
                image: '/logo.png',
                order_id: orderData.order.id, // Order ID from step 1
                handler: async function (response: any) {
                    try {
                        setLoading(true);
                        console.log('💳 Payment completed, verifying...', response);

                        // Step 3: Verify Payment (according to Razorpay docs)
                        const verifyPayload = {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            tier,
                            billingCycle,
                            ...(couponCode && { couponCode })
                        };

                        console.log('🔐 Verifying payment signature...');

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
                            // Success! Add additional info to success callback
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
                                toast.success(`🎉 Payment successful! You saved ₹${savings.toFixed(2)} with ${couponCode}!`);
                            } else {
                                toast.success('🎉 Payment successful! Your subscription is now active.');
                            }
                        } else {
                            throw new Error(verifyData.error || 'Payment verification failed');
                        }
                    } catch (verifyError: any) {
                        console.error('💥 Payment verification failed:', verifyError);
                        setError(verifyError.message);
                        onError(verifyError);
                        toast.error('❌ Payment verification failed: ' + verifyError.message);
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: '', // Will be auto-filled by Razorpay if available
                    email: '', // Will be auto-filled by Razorpay if available
                    contact: '' // Will be auto-filled by Razorpay if available
                },
                notes: {
                    tier,
                    billing_cycle: billingCycle,
                    platform: 'leetfriends',
                    ...(couponCode && { coupon_code: couponCode })
                },
                theme: {
                    color: '#7c3aed' // Purple theme matching your app
                },
                modal: {
                    confirm_close: true,
                    ondismiss: function () {
                        setLoading(false);
                        console.log('💭 Payment modal closed by user');
                    }
                },
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
                            ₹{originalAmount!.toFixed(2)}
                        </span>
                        <span className="font-semibold">
                            ₹{amount.toFixed(2)}
                        </span>
                    </div>
                </div>
            )}

            {/* Payment Button */}
            <div onClick={handlePayment}>
                {typeof children === 'function'
                    ? (children as (props: { loading: boolean; isFree: boolean }) => React.ReactNode)({ loading: loading || disabled, isFree })
                    : <Button
                        disabled={loading || disabled || !scriptLoaded}
                        className="w-full"
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                {isFree ? 'Activating...' : 'Processing...'}
                            </div>
                        ) : (
                            <>
                                {isFree ? 'Activate Free Subscription' :
                                    `Pay ₹${amount.toFixed(2)}`}
                            </>
                        )}
                    </Button>
                }
            </div>

            {!scriptLoaded && (
                <div className="text-center text-xs text-slate-400">
                    Loading payment gateway...
                </div>
            )}
        </div>
    );
}