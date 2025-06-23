// components/SubscriptionGuard.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ArrowLeft,
    Brain,
    CheckCircle,
    Crown,
    Lock,
    Sparkles,
    Target,
    Users,
    Zap
} from "lucide-react";
import { useRouter } from 'next/navigation';
import React from 'react';

interface SubscriptionGuardProps {
    userTier: 'free' | 'silver' | 'gold';
    requiredTier: 'silver' | 'gold';
    feature: string;
    featureDescription: string;
    children: React.ReactNode;
}

export default function SubscriptionGuard({
    userTier,
    requiredTier,
    feature,
    featureDescription,
    children
}: SubscriptionGuardProps) {
    const router = useRouter();

    // Check if user has access
    const hasAccess = () => {
        if (requiredTier === 'silver') {
            return userTier === 'silver' || userTier === 'gold';
        }
        if (requiredTier === 'gold') {
            return userTier === 'gold';
        }
        return false;
    };

    // If user has access, render the protected content
    if (hasAccess()) {
        return <>{children}</>;
    }

    // If user doesn't have access, show upgrade prompt
    const getTierInfo = (tier: 'silver' | 'gold') => {
        if (tier === 'silver') {
            return {
                name: 'Silver',
                color: 'text-slate-300',
                bgColor: 'from-slate-400 to-slate-600',
                monthlyPrice: '₹69',
                yearlyPrice: '₹95.90',
                icon: Sparkles,
                features: [
                    'AI Insights & Recommendations',
                    'Up to 15 Parties',
                    'Advanced Statistics',
                    'Priority Support'
                ]
            };
        }
        return {
            name: 'Gold',
            color: 'text-yellow-400',
            bgColor: 'from-yellow-400 to-yellow-600',
            monthlyPrice: '₹169',
            yearlyPrice: '₹191.90',
            icon: Crown,
            features: [
                'Interview Preparation (AI-Powered)',
                'Unlimited Parties',
                'AI Insights & Recommendations',
                'Advanced Statistics',
                'Priority Support',
                '24/7 Chat Support'
            ]
        };
    };

    const tierInfo = getTierInfo(requiredTier);
    const TierIcon = tierInfo.icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
            {/* Navigation Header */}
            <nav className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-950/80 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push("/dashboard")}
                                className="text-slate-400 hover:text-white hover:bg-slate-800/50"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center border-2 border-slate-700/50">
                                <Lock className="w-10 h-10 text-slate-400" />
                            </div>
                            <div className="absolute -top-2 -right-2">
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${tierInfo.bgColor} flex items-center justify-center`}>
                                    <TierIcon className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {tierInfo.name} Membership Required
                    </h1>
                    <p className="text-slate-400 text-lg mb-6">
                        Upgrade to {tierInfo.name} to access {feature}
                    </p>
                </div>

                {/* Feature Card */}
                <Card className="bg-slate-800/50 border-slate-700/50 mb-8">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center">
                            <Brain className="w-6 h-6 mr-3" />
                            {feature}
                            <Badge className={`ml-3 ${tierInfo.color} bg-yellow-400/10 border-yellow-400/30`}>
                                {tierInfo.name} Feature
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-300 mb-6">
                            {featureDescription}
                        </p>

                        {/* Feature highlights for Interview Prep */}
                        {feature.toLowerCase().includes('interview') && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="flex items-center space-x-3 p-3 bg-slate-900/50 rounded-lg">
                                    <Brain className="w-5 h-5 text-blue-400" />
                                    <span className="text-slate-300 text-sm">AI-Powered Question Generation</span>
                                </div>
                                <div className="flex items-center space-x-3 p-3 bg-slate-900/50 rounded-lg">
                                    <Target className="w-5 h-5 text-green-400" />
                                    <span className="text-slate-300 text-sm">Real-time Answer Evaluation</span>
                                </div>
                                <div className="flex items-center space-x-3 p-3 bg-slate-900/50 rounded-lg">
                                    <Zap className="w-5 h-5 text-yellow-400" />
                                    <span className="text-slate-300 text-sm">Speech-to-Text Support</span>
                                </div>
                                <div className="flex items-center space-x-3 p-3 bg-slate-900/50 rounded-lg">
                                    <Users className="w-5 h-5 text-purple-400" />
                                    <span className="text-slate-300 text-sm">Detailed Performance Reports</span>
                                </div>
                            </div>
                        )}

                        {/* Current tier display */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-white font-medium">Your Current Plan</h4>
                                    <p className="text-slate-400 text-sm">
                                        {userTier.charAt(0).toUpperCase() + userTier.slice(1)} Membership
                                    </p>
                                </div>
                                <Badge variant="outline" className="border-slate-600/30 text-slate-400">
                                    {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Upgrade Card */}
                <Card className={`bg-gradient-to-r ${tierInfo.bgColor} bg-opacity-10 border-2 border-opacity-30`}
                    style={{ borderColor: tierInfo.color.replace('text-', '') }}>
                    <CardHeader>
                        <CardTitle className={`text-white flex items-center`}>
                            <TierIcon className="w-6 h-6 mr-3" />
                            Upgrade to {tierInfo.name}
                            <Badge className={`ml-3 ${tierInfo.color} bg-yellow-400/10 border-yellow-400/30`}>
                                20% Off Yearly
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Pricing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                                <h4 className="text-white font-semibold mb-2">Monthly</h4>
                                <div className="text-2xl font-bold text-white mb-1">
                                    {tierInfo.monthlyPrice}
                                    <span className="text-slate-400 text-base font-normal">/month</span>
                                </div>
                                <p className="text-slate-400 text-sm">Billed monthly</p>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-4 border border-green-500/30 relative">
                                <div className="absolute -top-2 left-4">
                                    <Badge className="bg-green-600 text-white">Best Value</Badge>
                                </div>
                                <h4 className="text-white font-semibold mb-2">Yearly</h4>
                                <div className="text-2xl font-bold text-white mb-1">
                                    {tierInfo.yearlyPrice}
                                    <span className="text-slate-400 text-base font-normal">/month</span>
                                </div>
                                <p className="text-slate-400 text-sm">Billed annually</p>
                            </div>
                        </div>

                        {/* Features */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">What's included:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {tierInfo.features.map((feature, index) => (
                                    <div key={index} className="flex items-center space-x-3">
                                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                        <span className="text-slate-300 text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button
                                onClick={() => router.push("/pricing")}
                                className={`flex-1 bg-gradient-to-r ${tierInfo.bgColor} hover:opacity-90 transition-opacity`}
                                size="lg"
                            >
                                <TierIcon className="w-5 h-5 mr-2" />
                                Upgrade to {tierInfo.name}
                            </Button>
                            <Button
                                onClick={() => router.push("/dashboard")}
                                variant="outline"
                                className="flex-1 border-slate-600/30 text-slate-300 hover:text-white hover:bg-slate-800/50"
                                size="lg"
                            >
                                Maybe Later
                            </Button>
                        </div>

                        {/* Trial info if applicable */}
                        <div className="text-center">
                            <p className="text-slate-400 text-sm">
                                🎉 Start with a 7-day free trial • Cancel anytime • No setup fees
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}