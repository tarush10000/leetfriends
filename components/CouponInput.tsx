"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, Loader2, Tag, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CouponInputProps {
    tier: string;
    billingCycle: string;
    onCouponApplied: (discount: any) => void;
    onCouponRemoved: () => void;
    disabled?: boolean;
}

export default function CouponInput({ 
    tier, 
    billingCycle, 
    onCouponApplied, 
    onCouponRemoved,
    disabled = false 
}: CouponInputProps) {
    const [couponCode, setCouponCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [error, setError] = useState<string>('');

    const validateCoupon = async () => {
        if (!couponCode.trim()) {
            setError('Please enter a coupon code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: couponCode.trim(),
                    tier,
                    billingCycle
                })
            });

            const data = await response.json();

            if (data.valid) {
                setAppliedCoupon(data);
                onCouponApplied(data);
                toast.success(`Coupon applied! ${data.discount.discountPercentage}% off`);
            } else {
                setError(data.error);
                toast.error(data.error);
            }
        } catch (error) {
            setError('Failed to validate coupon');
            toast.error('Failed to validate coupon');
        } finally {
            setLoading(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setError('');
        onCouponRemoved();
        toast.info('Coupon removed');
    };

    if (appliedCoupon) {
        return (
            <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-green-400">
                                        {appliedCoupon.coupon.code}
                                    </span>
                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                        {appliedCoupon.discount.discountPercentage}% OFF
                                    </Badge>
                                </div>
                                <p className="text-sm text-green-300">
                                    {appliedCoupon.coupon.description}
                                </p>
                                <p className="text-xs text-green-400 mt-1">
                                    You save ₹{(appliedCoupon.discount.discountAmount / 100).toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeCoupon}
                            className="text-green-400 hover:text-green-300"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-4">
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-300">
                            Have a coupon code?
                        </span>
                    </div>
                    
                    <div className="flex space-x-2">
                        <Input
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => {
                                setCouponCode(e.target.value.toUpperCase());
                                setError('');
                            }}
                            disabled={disabled || loading}
                            className="bg-slate-700/50 border-slate-600 text-white"
                        />
                        <Button
                            onClick={validateCoupon}
                            disabled={disabled || loading || !couponCode.trim()}
                            variant="outline"
                            className="border-slate-600"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                'Apply'
                            )}
                        </Button>
                    </div>

                    {error && (
                        <div className="flex items-center space-x-2 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
