"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Star } from 'lucide-react';

interface FeatureAccessGuardProps {
    feature: 'insights' | 'interview-prep';
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export default function FeatureAccessGuard({ 
    feature, 
    children, 
    fallback 
}: FeatureAccessGuardProps) {
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [currentTier, setCurrentTier] = useState<string>('free');
    const router = useRouter();

    useEffect(() => {
        checkAccess();
    }, [feature]);

    const checkAccess = async () => {
        try {
            const response = await fetch('/api/user/subscription-limits');
            if (response.ok) {
                const data = await response.json();
                setCurrentTier(data.currentTier);
                
                if (feature === 'insights') {
                    setHasAccess(data.permissions.canAccessInsights);
                } else if (feature === 'interview-prep') {
                    setHasAccess(data.permissions.canAccessInterviewPrep);
                }
            }
        } catch (error) {
            console.error('Failed to check feature access:', error);
            setHasAccess(false);
        }
    };

    if (hasAccess === null) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (hasAccess) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    const featureConfig = {
        insights: {
            title: 'AI Insights',
            description: 'Get personalized recommendations, problem suggestions, and performance analytics powered by AI.',
            requiredTier: 'Silver',
            icon: Star
        },
        'interview-prep': {
            title: 'Interview Preparation',
            description: 'Access curated interview questions, company-specific problems, and practice sessions.',
            requiredTier: 'Gold',
            icon: Crown
        }
    };

    const config = featureConfig[feature];

    return (
        <Card className="bg-slate-800/30 border-slate-700/50 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
            <CardContent className="p-8 text-center relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{config.title}</h3>
                <p className="text-slate-400 mb-6">{config.description}</p>
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 mb-6">
                    Requires {config.requiredTier}+
                </Badge>
                <Button
                    onClick={() => router.push('/pricing')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full"
                >
                    <config.icon className="w-4 h-4 mr-2" />
                    Upgrade Now
                </Button>
            </CardContent>
        </Card>
    );
}