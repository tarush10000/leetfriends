// components/UpgradeSuccessNotification.tsx
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Crown, Sparkles, Star, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UpgradeSuccessNotificationProps {
    show: boolean;
    tier?: string;
    onClose: () => void;
}

export default function UpgradeSuccessNotification({ 
    show, 
    tier, 
    onClose 
}: UpgradeSuccessNotificationProps) {
    const [isVisible, setIsVisible] = useState(show);

    useEffect(() => {
        setIsVisible(show);
        if (show) {
            // Auto-close after 10 seconds
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onClose, 300); // Wait for animation to complete
            }, 10000);
            
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    if (!show) return null;

    const tierConfig = {
        silver: {
            name: 'Silver',
            color: 'from-purple-600 to-pink-600',
            icon: Star,
            features: ['AI Insights', 'Advanced Analytics', '15 Party Limit']
        },
        gold: {
            name: 'Gold',
            color: 'from-yellow-500 to-orange-600',
            icon: Crown,
            features: ['Interview Prep', 'Unlimited Parties', 'Full AI Suite']
        }
    };

    const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.silver;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                    >
                        <Card className="bg-slate-800/95 border-slate-700/50 backdrop-blur-sm max-w-md w-full relative overflow-hidden">
                            {/* Background Effects */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-pink-600" />
                            
                            {/* Close Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClose}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"
                            >
                                <X className="w-4 h-4" />
                            </Button>

                            <CardContent className="p-8 text-center relative">
                                {/* Success Icon with Animation */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ 
                                        type: "spring", 
                                        delay: 0.2, 
                                        duration: 0.6,
                                        bounce: 0.5 
                                    }}
                                    className={`w-20 h-20 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center mx-auto mb-6 relative`}
                                >
                                    <CheckCircle className="w-10 h-10 text-white" />
                                    <motion.div
                                        animate={{ 
                                            scale: [1, 1.2, 1],
                                            opacity: [0.5, 0.8, 0.5]
                                        }}
                                        transition={{ 
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.color} opacity-30`}
                                    />
                                </motion.div>

                                {/* Success Message */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 mr-2 text-yellow-400" />
                                        Upgrade Successful!
                                    </h2>
                                    <p className="text-slate-300 mb-6">
                                        Welcome to <span className={`font-bold bg-gradient-to-r ${config.color} text-transparent bg-clip-text`}>
                                            {config.name} tier
                                        </span>! You now have access to premium features.
                                    </p>
                                </motion.div>

                                {/* New Features */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="space-y-3 mb-6"
                                >
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                                        Now Available:
                                    </h3>
                                    <div className="space-y-2">
                                        {config.features.map((feature, index) => (
                                            <motion.div
                                                key={feature}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.8 + index * 0.1 }}
                                                className="flex items-center justify-center"
                                            >
                                                <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                                                <span className="text-slate-300 text-sm">{feature}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Action Buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1 }}
                                    className="space-y-3"
                                >
                                    <Button
                                        onClick={handleClose}
                                        className={`w-full bg-gradient-to-r ${config.color} hover:opacity-90 transition-opacity`}
                                    >
                                        <config.icon className="w-4 h-4 mr-2" />
                                        Explore New Features
                                    </Button>
                                    <p className="text-xs text-slate-500">
                                        Your subscription is now active and features are unlocked
                                    </p>
                                </motion.div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}