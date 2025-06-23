"use client";

import { motion } from "framer-motion";
import {
    BarChart3,
    Brain,
    Building,
    Calendar,
    CheckCircle,
    Clock,
    Code,
    Crown,
    Lightbulb,
    Lock,
    LogOut,
    Menu,
    Plus,
    Search,
    Settings,
    Star,
    Target,
    TrendingUp,
    Trophy,
    Users,
    X,
    Zap
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import EnhancedAIInsights from "./AIRecommendations";
import InterviewPrep from "./InterviewPrep2";
import UpgradeSuccessNotification from "./UpgradeSuccessNotification";

// Types
interface PartyPreview {
    code: string;
    name: string;
    memberCount: number;
    createdAt: string;
    isOwner: boolean;
}

interface SubscriptionTier {
    name: string;
    level: 'free' | 'silver' | 'gold';
    maxParties: number;
    hasAIInsights: boolean;
    hasInterviewPrep: boolean;
    color: string;
    icon: any;
}

interface SubscriptionData {
    currentTier: string;
    tierLimits: {
        name: string;
        maxParties: number;
        hasAIInsights: boolean;
        hasInterviewPrep: boolean;
    };
    usage: {
        createdParties: number;
        totalParties: number;
    };
    permissions: {
        canCreateParty: boolean;
        canAccessInsights: boolean;
        canAccessInterviewPrep: boolean;
    };
}

interface DashboardProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    userProfile?: {
        handle: string;
        leetcodeUsername: string;
        displayName: string;
        onboarded: boolean;
        subscriptionTier?: 'free' | 'silver' | 'gold';
        initialStats?: {
            easy: number;
            medium: number;
            hard: number;
            total: number;
        };
        currentStats?: {
            easy: number;
            medium: number;
            hard: number;
            total: number;
        };
    };
    upgradeSuccess?: boolean;
    upgradedTier?: string;
}

type TabType = 'overview' | 'achievements' | 'recommendations' | 'interview-prep';

const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
    free: {
        name: 'Free',
        level: 'free',
        maxParties: 5,
        hasAIInsights: false,
        hasInterviewPrep: false,
        color: 'text-slate-400',
        icon: Users
    },
    silver: {
        name: 'Silver',
        level: 'silver',
        maxParties: 15,
        hasAIInsights: true,
        hasInterviewPrep: false,
        color: 'text-slate-300',
        icon: Star
    },
    gold: {
        name: 'Gold',
        level: 'gold',
        maxParties: -1, // unlimited
        hasAIInsights: true,
        hasInterviewPrep: true,
        color: 'text-yellow-400',
        icon: Crown
    }
};

export default function Dashboard({ user, userProfile, upgradeSuccess = false, upgradedTier }: DashboardProps) {
    const [parties, setParties] = useState<PartyPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showUpgradeNotification, setShowUpgradeNotification] = useState(upgradeSuccess);
    const [showAudioInterview, setShowAudioInterview] = useState(false);
    const router = useRouter();
    const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
    const [subscriptionLoading, setSubscriptionLoading] = useState(true);

    const currentTier = subscriptionData ? SUBSCRIPTION_TIERS[subscriptionData.currentTier as keyof typeof SUBSCRIPTION_TIERS] : SUBSCRIPTION_TIERS.free;

    useEffect(() => {
        fetch("/api/user/parties")
            .then((res) => res.json())
            .then((data) => {
                setParties(data || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        const fetchSubscriptionData = async () => {
            try {
                setSubscriptionLoading(true);
                const response = await fetch('/api/user/subscription-limits');
                if (response.ok) {
                    const data = await response.json();
                    setSubscriptionData(data);
                    console.log('Subscription data loaded:', data); // For debugging
                } else {
                    console.error('Failed to fetch subscription data');
                    // Fallback to free tier
                    setSubscriptionData({
                        currentTier: 'free',
                        tierLimits: { name: 'Free', maxParties: 5, hasAIInsights: false, hasInterviewPrep: false },
                        usage: { createdParties: 0, totalParties: 0 },
                        permissions: { canCreateParty: true, canAccessInsights: false, canAccessInterviewPrep: false }
                    });
                }
            } catch (error) {
                console.error('Error fetching subscription data:', error);
                // Fallback to free tier
                setSubscriptionData({
                    currentTier: 'free',
                    tierLimits: { name: 'Free', maxParties: 5, hasAIInsights: false, hasInterviewPrep: false },
                    usage: { createdParties: 0, totalParties: 0 },
                    permissions: { canCreateParty: true, canAccessInsights: false, canAccessInterviewPrep: false }
                });
            } finally {
                setSubscriptionLoading(false);
            }
        };

        fetchSubscriptionData();
    }, []);

    // Show upgrade notification if user just upgraded
    useEffect(() => {
        if (upgradeSuccess) {
            setShowUpgradeNotification(true);
        }
    }, [upgradeSuccess]);

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/" });
    };

    const canAccessFeature = (feature: 'insights' | 'interview-prep') => {
        if (!subscriptionData) return false;

        if (feature === 'insights') return subscriptionData.permissions.canAccessInsights;
        if (feature === 'interview-prep') return subscriptionData.permissions.canAccessInterviewPrep;
        return false;
    };

    const canCreateParty = () => {
        if (currentTier.maxParties === -1) return true;
        return parties.length < currentTier.maxParties;
    };

    const filteredParties = parties.filter(party =>
        party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        party.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Achievement system functions
    const getAllAchievements = () => {
        const currentStats = userProfile?.currentStats || { easy: 0, medium: 0, hard: 0, total: 0 };
        const totalSolved = currentStats.total;
        const partiesCount = parties.length;
        const createdPartiesCount = parties.filter(p => p.isOwner).length;

        // Mock streak data - in real app, this would come from user data
        const currentStreak = 0; // This should come from user data
        const maxStreak = 3; // This should come from user data

        return [
            // Progress Achievements - Problems Solved
            { id: 'first_solve', name: 'First Steps', description: 'Solve your first problem', icon: Target, xp: 50, unlocked: totalSolved >= 1, category: 'progress', tier: 'bronze' },
            { id: 'ten_problems', name: 'Getting Started', description: 'Solve 10 problems', icon: Code, xp: 100, unlocked: totalSolved >= 10, category: 'progress', tier: 'bronze' },
            { id: 'twenty_five_problems', name: 'Quarter Century', description: 'Solve 25 problems', icon: Target, xp: 150, unlocked: totalSolved >= 25, category: 'progress', tier: 'bronze' },
            { id: 'fifty_problems', name: 'Problem Solver', description: 'Solve 50 problems', icon: Brain, xp: 250, unlocked: totalSolved >= 50, category: 'progress', tier: 'silver' },
            { id: 'hundred_problems', name: 'Century Club', description: 'Solve 100 problems', icon: Trophy, xp: 500, unlocked: totalSolved >= 100, category: 'progress', tier: 'gold' },
            { id: 'two_hundred_problems', name: 'Problem Master', description: 'Solve 200 problems', icon: Crown, xp: 1000, unlocked: totalSolved >= 200, category: 'progress', tier: 'gold' },
            { id: 'three_hundred_problems', name: 'Coding Guru', description: 'Solve 300 problems', icon: Star, xp: 1500, unlocked: totalSolved >= 300, category: 'progress', tier: 'platinum' },
            { id: 'five_hundred_problems', name: 'Algorithm Expert', description: 'Solve 500 problems', icon: Zap, xp: 2500, unlocked: totalSolved >= 500, category: 'progress', tier: 'platinum' },

            // Difficulty-based Achievements
            { id: 'easy_ten', name: 'Easy Rider', description: 'Solve 10 easy problems', icon: CheckCircle, xp: 75, unlocked: currentStats.easy >= 10, category: 'difficulty', tier: 'bronze' },
            { id: 'easy_fifty', name: 'Foundation Builder', description: 'Solve 50 easy problems', icon: Target, xp: 200, unlocked: currentStats.easy >= 50, category: 'difficulty', tier: 'silver' },
            { id: 'medium_ten', name: 'Rising Challenge', description: 'Solve 10 medium problems', icon: TrendingUp, xp: 150, unlocked: currentStats.medium >= 10, category: 'difficulty', tier: 'silver' },
            { id: 'medium_fifty', name: 'Intermediate Pro', description: 'Solve 50 medium problems', icon: Brain, xp: 400, unlocked: currentStats.medium >= 50, category: 'difficulty', tier: 'gold' },
            { id: 'hard_five', name: 'Challenge Accepted', description: 'Solve 5 hard problems', icon: Crown, xp: 200, unlocked: currentStats.hard >= 5, category: 'difficulty', tier: 'silver' },
            { id: 'hard_twenty', name: 'Hard Core', description: 'Solve 20 hard problems', icon: Star, xp: 600, unlocked: currentStats.hard >= 20, category: 'difficulty', tier: 'gold' },
            { id: 'hard_fifty', name: 'Algorithm Wizard', description: 'Solve 50 hard problems', icon: Zap, xp: 1200, unlocked: currentStats.hard >= 50, category: 'difficulty', tier: 'platinum' },

            // Social Achievements
            { id: 'first_party', name: 'Party Starter', description: 'Create your first party', icon: Users, xp: 75, unlocked: createdPartiesCount >= 1, category: 'social', tier: 'bronze' },
            { id: 'party_joiner', name: 'Social Coder', description: 'Join your first party', icon: Users, xp: 50, unlocked: partiesCount >= 1, category: 'social', tier: 'bronze' },
            { id: 'three_parties', name: 'Community Builder', description: 'Join 3 different parties', icon: Users, xp: 150, unlocked: partiesCount >= 3, category: 'social', tier: 'bronze' },
            { id: 'five_parties', name: 'Social Butterfly', description: 'Join 5 different parties', icon: Users, xp: 200, unlocked: partiesCount >= 5, category: 'social', tier: 'silver' },
            { id: 'party_host', name: 'Host with the Most', description: 'Create 3 parties', icon: Building, xp: 300, unlocked: createdPartiesCount >= 3, category: 'social', tier: 'silver' },
            { id: 'party_master', name: 'Party Master', description: 'Create 5 parties', icon: Crown, xp: 500, unlocked: createdPartiesCount >= 5, category: 'social', tier: 'gold' },

            // Streak Achievements
            { id: 'three_day_streak', name: 'Consistency', description: 'Solve problems for 3 consecutive days', icon: Calendar, xp: 100, unlocked: maxStreak >= 3, category: 'streak', tier: 'bronze' },
            { id: 'week_streak', name: 'Weekly Warrior', description: 'Solve problems for 7 consecutive days', icon: TrendingUp, xp: 300, unlocked: maxStreak >= 7, category: 'streak', tier: 'silver' },
            { id: 'two_week_streak', name: 'Dedicated Coder', description: 'Solve problems for 14 consecutive days', icon: Target, xp: 500, unlocked: maxStreak >= 14, category: 'streak', tier: 'silver' },
            { id: 'month_streak', name: 'Monthly Master', description: 'Solve problems for 30 consecutive days', icon: Trophy, xp: 1000, unlocked: maxStreak >= 30, category: 'streak', tier: 'gold' },
            { id: 'fifty_day_streak', name: 'Unstoppable', description: 'Solve problems for 50 consecutive days', icon: Star, xp: 1500, unlocked: maxStreak >= 50, category: 'streak', tier: 'gold' },
            { id: 'hundred_day_streak', name: 'Century Streak', description: 'Solve problems for 100 consecutive days', icon: Crown, xp: 2500, unlocked: maxStreak >= 100, category: 'streak', tier: 'platinum' },

            // Special Achievements
            { id: 'early_bird', name: 'Early Bird', description: 'Solve a problem before 8 AM', icon: Clock, xp: 150, unlocked: false, category: 'special', tier: 'bronze' },
            { id: 'night_owl', name: 'Night Owl', description: 'Solve a problem after 11 PM', icon: Star, xp: 150, unlocked: false, category: 'special', tier: 'bronze' },
            { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Solve 10 problems on weekends', icon: Zap, xp: 200, unlocked: false, category: 'special', tier: 'silver' },
            { id: 'speed_demon', name: 'Speed Demon', description: 'Solve 5 problems in one day', icon: TrendingUp, xp: 250, unlocked: false, category: 'special', tier: 'silver' },
            { id: 'marathon_coder', name: 'Marathon Coder', description: 'Solve 10 problems in one day', icon: Crown, xp: 500, unlocked: false, category: 'special', tier: 'gold' },
            { id: 'tier_upgrade', name: 'Premium Member', description: 'Upgrade to a paid tier', icon: Crown, xp: 500, unlocked: currentTier.level !== 'free', category: 'special', tier: 'gold' },
            { id: 'profile_complete', name: 'All Set Up', description: 'Complete your profile setup', icon: CheckCircle, xp: 100, unlocked: userProfile?.onboarded || false, category: 'special', tier: 'bronze' },

            // Time-based Achievements
            { id: 'daily_solver', name: 'Daily Solver', description: 'Solve at least one problem today', icon: Calendar, xp: 25, unlocked: false, category: 'time', tier: 'bronze' },
            { id: 'weekly_goal', name: 'Weekly Goal', description: 'Solve 7 problems this week', icon: Target, xp: 100, unlocked: false, category: 'time', tier: 'bronze' },
            { id: 'monthly_challenger', name: 'Monthly Challenger', description: 'Solve 30 problems this month', icon: Trophy, xp: 300, unlocked: false, category: 'time', tier: 'silver' },

            // Milestone Achievements
            { id: 'leetcode_veteran', name: 'LeetCode Veteran', description: 'Active for 30 days', icon: Star, xp: 200, unlocked: false, category: 'milestone', tier: 'silver' },
            { id: 'coding_champion', name: 'Coding Champion', description: 'Active for 100 days', icon: Crown, xp: 500, unlocked: false, category: 'milestone', tier: 'gold' },
            { id: 'algorithm_legend', name: 'Algorithm Legend', description: 'Active for 365 days', icon: Zap, xp: 1000, unlocked: false, category: 'milestone', tier: 'platinum' },

            // Competition Achievements
            { id: 'first_challenge', name: 'Challenge Rookie', description: 'Complete your first party challenge', icon: Target, xp: 100, unlocked: false, category: 'competition', tier: 'bronze' },
            { id: 'challenge_winner', name: 'Challenge Winner', description: 'Win a party challenge', icon: Trophy, xp: 200, unlocked: false, category: 'competition', tier: 'silver' },
            { id: 'speed_champion', name: 'Speed Champion', description: 'Finish first in 3 challenges', icon: Zap, xp: 400, unlocked: false, category: 'competition', tier: 'gold' },
            { id: 'undefeated', name: 'Undefeated', description: 'Win 10 challenges in a row', icon: Crown, xp: 800, unlocked: false, category: 'competition', tier: 'platinum' },
        ];
    };

    const getUnlockedAchievements = () => {
        return getAllAchievements().filter(achievement => achievement.unlocked);
    };

    const calculateTotalXP = () => {
        return getUnlockedAchievements().reduce((total, achievement) => total + achievement.xp, 0);
    };

    const getProgressAchievements = () => {
        return getAllAchievements().filter(achievement => achievement.category === 'progress');
    };

    const getDifficultyAchievements = () => {
        return getAllAchievements().filter(achievement => achievement.category === 'difficulty');
    };

    const getSocialAchievements = () => {
        return getAllAchievements().filter(achievement => achievement.category === 'social');
    };

    const getSpecialAchievements = () => {
        return getAllAchievements().filter(achievement => achievement.category === 'special');
    };

    const getStreakAchievements = () => {
        return getAllAchievements().filter(achievement => achievement.category === 'streak');
    };

    const getTimeAchievements = () => {
        return getAllAchievements().filter(achievement => achievement.category === 'time');
    };

    const getMilestoneAchievements = () => {
        return getAllAchievements().filter(achievement => achievement.category === 'milestone');
    };

    const getCompetitionAchievements = () => {
        return getAllAchievements().filter(achievement => achievement.category === 'competition');
    };

    // Achievement Card Component
    const AchievementCard = ({ achievement }: { achievement: any }) => {
        const getTierColor = (tier: string) => {
            switch (tier) {
                case 'bronze': return 'from-amber-600 to-orange-700 border-amber-500/30 text-amber-300';
                case 'silver': return 'from-slate-400 to-slate-600 border-slate-400/30 text-slate-300';
                case 'gold': return 'from-yellow-400 to-yellow-600 border-yellow-400/30 text-yellow-300';
                case 'platinum': return 'from-purple-400 to-purple-600 border-purple-400/30 text-purple-300';
                default: return 'from-slate-500 to-slate-700 border-slate-500/30 text-slate-400';
            }
        };

        const getTierBadgeColor = (tier: string) => {
            switch (tier) {
                case 'bronze': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                case 'silver': return 'bg-slate-400/20 text-slate-300 border-slate-400/30';
                case 'gold': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                case 'platinum': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
                default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
            }
        };

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`relative overflow-hidden rounded-lg border transition-all duration-200 ${achievement.unlocked
                    ? `bg-gradient-to-br ${getTierColor(achievement.tier).split(' ')[0]} ${getTierColor(achievement.tier).split(' ')[1]}/10 ${getTierColor(achievement.tier).split(' ')[2]} hover:border-opacity-70`
                    : 'bg-slate-800/30 border-slate-600/30 hover:border-slate-500/50'
                    }`}
            >
                {achievement.unlocked && (
                    <div className="absolute top-2 right-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                )}

                <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${achievement.unlocked
                            ? `bg-gradient-to-br ${getTierColor(achievement.tier).split(' ')[0]} ${getTierColor(achievement.tier).split(' ')[1]}`
                            : 'bg-slate-700'
                            }`}>
                            <achievement.icon className={`w-6 h-6 ${achievement.unlocked ? 'text-white' : 'text-slate-400'
                                }`} />
                        </div>

                        <Badge
                            variant="outline"
                            className={`text-xs ${achievement.unlocked
                                ? getTierBadgeColor(achievement.tier)
                                : 'border-slate-600/30 text-slate-500'
                                }`}
                        >
                            {achievement.tier?.toUpperCase() || 'BRONZE'}
                        </Badge>
                    </div>

                    <h3 className={`font-semibold mb-1 text-sm ${achievement.unlocked ? 'text-white' : 'text-slate-400'
                        }`}>
                        {achievement.name}
                    </h3>

                    <p className={`text-xs mb-3 leading-relaxed ${achievement.unlocked ? 'text-slate-300' : 'text-slate-500'
                        }`}>
                        {achievement.description}
                    </p>

                    <div className="flex items-center justify-between">
                        <Badge
                            variant="outline"
                            className={`text-xs ${achievement.unlocked
                                ? 'border-green-500/30 text-green-400'
                                : 'border-slate-600/30 text-slate-500'
                                }`}
                        >
                            {achievement.xp} XP
                        </Badge>

                        {achievement.unlocked && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                ✓ Unlocked
                            </Badge>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    const LockedFeatureCard = ({ title, description, requiredTier }: { title: string, description: string, requiredTier: string }) => (
        <Card className="bg-slate-800/30 border-slate-700/50 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
            <CardContent className="p-6 text-center relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 mb-4">{description}</p>
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 mb-4">
                    Requires {requiredTier}+
                </Badge>
                <Button
                    onClick={() => router.push('/pricing')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full"
                >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Now
                </Button>
            </CardContent>
        </Card>
    );

    const tabs = [
        {
            id: 'overview',
            name: 'Overview',
            icon: BarChart3,
            mobileIcon: BarChart3,
        },
        {
            id: 'achievements',
            name: 'Achievements',
            icon: Trophy,
            mobileIcon: Trophy,
        },
        {
            id: 'recommendations',
            name: 'AI Insights',
            icon: Brain,
            mobileIcon: Brain,
            locked: !canAccessFeature('insights'),
        },
        {
            id: 'interview-prep',
            name: 'Interview Prep',
            icon: Building,
            mobileIcon: Building,
            locked: !canAccessFeature('interview-prep'),
        }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                                    <CardContent className="p-4 lg:p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-green-300 text-sm font-medium">Problems Solved</p>
                                                <p className="text-2xl lg:text-3xl font-bold text-white">
                                                    {userProfile?.currentStats?.total || 0}
                                                </p>
                                                <div className="flex flex-wrap gap-2 text-xs mt-2">
                                                    <span className="text-green-400">Easy: {userProfile?.currentStats?.easy || 0}</span>
                                                    <span className="text-yellow-400">Medium: {userProfile?.currentStats?.medium || 0}</span>
                                                    <span className="text-red-400">Hard: {userProfile?.currentStats?.hard || 0}</span>
                                                </div>
                                            </div>
                                            <Target className="w-8 h-8 lg:w-12 lg:h-12 text-green-400" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                                    <CardContent className="p-4 lg:p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-blue-300 text-sm font-medium">Active Parties</p>
                                                <p className="text-2xl lg:text-3xl font-bold text-white">{parties.length}</p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {currentTier.maxParties === -1 ? 'Unlimited' : `${currentTier.maxParties} max`}
                                                </p>
                                            </div>
                                            <Users className="w-8 h-8 lg:w-12 lg:h-12 text-blue-400" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                                    <CardContent className="p-4 lg:p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-purple-300 text-sm font-medium">Current Plan</p>
                                                <div className="flex items-center gap-2">
                                                    <currentTier.icon className={`w-5 h-5 ${currentTier.color}`} />
                                                    <p className={`text-xl lg:text-2xl font-bold ${currentTier.color}`}>
                                                        {currentTier.name}
                                                    </p>
                                                </div>
                                                {currentTier.level === 'free' && (
                                                    <p className="text-xs text-slate-400 mt-1">Upgrade for more features</p>
                                                )}
                                            </div>
                                            <currentTier.icon className={`w-8 h-8 lg:w-12 lg:h-12 ${currentTier.color}`} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                                    <CardContent className="p-4 lg:p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-orange-300 text-sm font-medium">Progress</p>
                                                <p className="text-2xl lg:text-3xl font-bold text-white">
                                                    {userProfile?.currentStats?.total && userProfile?.initialStats?.total
                                                        ? Math.max(0, userProfile.currentStats.total - userProfile.initialStats.total)
                                                        : 0}
                                                </p>
                                            </div>
                                            <TrendingUp className="w-8 h-8 lg:w-12 lg:h-12 text-orange-400" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={() => {
                                    if (canCreateParty()) {
                                        router.push("/party/create");
                                    } else {
                                        router.push("/pricing");
                                    }
                                }}
                                className={`flex-1 ${canCreateParty()
                                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                    : "bg-slate-700/50 hover:bg-slate-600/50 border border-purple-500/30"
                                    }`}
                                disabled={!canCreateParty()}
                            >
                                {canCreateParty() ? (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Party
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4 mr-2" />
                                        Upgrade to Create More Parties
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push("/party/join")}
                                className="flex-1 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Join Party
                            </Button>
                        </div>

                        {/* Parties List */}
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <CardTitle className="text-white flex items-center">
                                        <Users className="w-5 h-5 mr-2" />
                                        My Parties
                                    </CardTitle>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                        <Input
                                            placeholder="Search parties..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 bg-slate-700/50 border-slate-600 text-white w-full sm:w-64"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="text-center py-8">
                                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-slate-400">Loading parties...</p>
                                    </div>
                                ) : filteredParties.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            {searchQuery ? 'No parties found' : 'No parties yet'}
                                        </h3>
                                        <p className="text-slate-400 mb-4">
                                            {searchQuery
                                                ? 'Try adjusting your search terms'
                                                : 'Create your first party to start competing with friends!'
                                            }
                                        </p>
                                        {!searchQuery && canCreateParty() && (
                                            <Button
                                                onClick={() => router.push("/party/create")}
                                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Create Your First Party
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredParties.map((party, index) => (
                                            <motion.div
                                                key={party.code}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <Card
                                                    className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 transition-all duration-200 cursor-pointer"
                                                    onClick={() => router.push(`/party/${party.code}`)}
                                                >
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold text-white truncate">
                                                                    {party.name}
                                                                </h3>
                                                                <p className="text-sm text-slate-400">
                                                                    Code: {party.code}
                                                                </p>
                                                            </div>
                                                            {party.isOwner && (
                                                                <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                                                                    Owner
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-slate-300 flex items-center">
                                                                <Users className="w-4 h-4 mr-1" />
                                                                {party.memberCount} members
                                                            </span>
                                                            <span className="text-slate-400 flex items-center">
                                                                <Calendar className="w-4 h-4 mr-1" />
                                                                {new Date(party.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'achievements':
                return (
                    <div className="space-y-6">
                        {/* Achievement Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-yellow-300 text-sm font-medium">Achievements Unlocked</p>
                                            <p className="text-2xl font-bold text-white">
                                                {getUnlockedAchievements().length}
                                            </p>
                                            <p className="text-xs text-slate-400">of {getAllAchievements().length} total</p>
                                        </div>
                                        <Trophy className="w-8 h-8 text-yellow-400" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-purple-300 text-sm font-medium">Total XP</p>
                                            <p className="text-2xl font-bold text-white">
                                                {calculateTotalXP()}
                                            </p>
                                            <p className="text-xs text-slate-400">Experience Points</p>
                                        </div>
                                        <Star className="w-8 h-8 text-purple-400" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-green-300 text-sm font-medium">Completion Rate</p>
                                            <p className="text-2xl font-bold text-white">
                                                {Math.round((getUnlockedAchievements().length / getAllAchievements().length) * 100)}%
                                            </p>
                                            <p className="text-xs text-slate-400">Progress</p>
                                        </div>
                                        <Target className="w-8 h-8 text-green-400" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Achievement Categories */}
                        <div className="space-y-6">
                            {/* Progress Achievements */}
                            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center">
                                        <Target className="w-5 h-5 mr-2" />
                                        Progress Achievements
                                        <Badge variant="outline" className="ml-2 border-slate-600/30 text-slate-400">
                                            {getProgressAchievements().filter(a => a.unlocked).length}/{getProgressAchievements().length}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {getProgressAchievements().map((achievement, index) => (
                                            <AchievementCard key={index} achievement={achievement} />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Difficulty Achievements */}
                            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center">
                                        <Brain className="w-5 h-5 mr-2" />
                                        Difficulty Achievements
                                        <Badge variant="outline" className="ml-2 border-slate-600/30 text-slate-400">
                                            {getDifficultyAchievements().filter(a => a.unlocked).length}/{getDifficultyAchievements().length}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {getDifficultyAchievements().map((achievement, index) => (
                                            <AchievementCard key={index} achievement={achievement} />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Streak Achievements */}
                            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center">
                                        <Zap className="w-5 h-5 mr-2" />
                                        Streak Achievements
                                        <Badge variant="outline" className="ml-2 border-slate-600/30 text-slate-400">
                                            {getStreakAchievements().filter(a => a.unlocked).length}/{getStreakAchievements().length}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Current Streak Display */}
                                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                                                        <Calendar className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-white">Current Streak</h3>
                                                        <p className="text-sm text-slate-400">Keep solving to maintain your streak!</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-3xl font-bold text-orange-400">0 days</div>
                                                    <div className="text-sm text-slate-400">Longest: 3 days</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Streak Achievements Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {getStreakAchievements().map((achievement, index) => (
                                                <AchievementCard key={index} achievement={achievement} />
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Social Achievements */}
                            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center">
                                        <Users className="w-5 h-5 mr-2" />
                                        Social Achievements
                                        <Badge variant="outline" className="ml-2 border-slate-600/30 text-slate-400">
                                            {getSocialAchievements().filter(a => a.unlocked).length}/{getSocialAchievements().length}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {getSocialAchievements().map((achievement, index) => (
                                            <AchievementCard key={index} achievement={achievement} />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Special Achievements */}
                            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center">
                                        <Crown className="w-5 h-5 mr-2" />
                                        Special Achievements
                                        <Badge variant="outline" className="ml-2 border-slate-600/30 text-slate-400">
                                            {getSpecialAchievements().filter(a => a.unlocked).length}/{getSpecialAchievements().length}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {getSpecialAchievements().map((achievement, index) => (
                                            <AchievementCard key={index} achievement={achievement} />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Competition Achievements */}
                            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center">
                                        <Trophy className="w-5 h-5 mr-2" />
                                        Competition Achievements
                                        <Badge variant="outline" className="ml-2 border-slate-600/30 text-slate-400">
                                            {getCompetitionAchievements().filter(a => a.unlocked).length}/{getCompetitionAchievements().length}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {getCompetitionAchievements().map((achievement, index) => (
                                            <AchievementCard key={index} achievement={achievement} />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );

            case 'recommendations':
                if (!canAccessFeature('insights')) {
                    return (
                        <LockedFeatureCard
                            title="AI Insights"
                            description="Get personalized recommendations, problem suggestions, and performance analytics powered by AI."
                            requiredTier="Silver"
                        />
                    );
                }

                // Check if user has LeetCode stats
                if (!userProfile?.currentStats || userProfile.currentStats.total === 0) {
                    return (
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8 text-center">
                                <div className="mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Brain className="w-8 h-8 text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Ready for AI Insights!</h3>
                                    <p className="text-slate-400 max-w-md mx-auto">
                                        Connect your LeetCode account and start solving problems to unlock personalized AI-powered recommendations and insights.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                                        <div className="bg-slate-700/30 p-4 rounded-lg">
                                            <Target className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                                            <p className="text-sm text-slate-300 font-medium">Weakness Analysis</p>
                                            <p className="text-xs text-slate-400 mt-1">Identify areas to improve</p>
                                        </div>
                                        <div className="bg-slate-700/30 p-4 rounded-lg">
                                            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                                            <p className="text-sm text-slate-300 font-medium">Progress Tracking</p>
                                            <p className="text-xs text-slate-400 mt-1">Monitor your growth</p>
                                        </div>
                                        <div className="bg-slate-700/30 p-4 rounded-lg">
                                            <Lightbulb className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                                            <p className="text-sm text-slate-300 font-medium">Smart Suggestions</p>
                                            <p className="text-xs text-slate-400 mt-1">Get personalized tips</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <Button
                                            onClick={() => router.push('/settings')}
                                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                        >
                                            <Settings className="w-4 h-4 mr-2" />
                                            Update LeetCode Profile
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => window.open('https://leetcode.com', '_blank')}
                                            className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50"
                                        >
                                            <Code className="w-4 h-4 mr-2" />
                                            Practice on LeetCode
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                }

                return <EnhancedAIInsights userProfile={userProfile} userEmail={""} />;

            case 'interview-prep':
                if (!canAccessFeature('interview-prep')) {
                    return (
                        <LockedFeatureCard
                            title="Interview Preparation"
                            description="Access curated interview questions, company-specific problems, and practice sessions."
                            requiredTier="Gold"
                        />
                    );
                }
                return (
                    <div className="space-y-6">
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center">
                                    <Building className="w-5 h-5 mr-2" />
                                    Interview Preparation
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Button
                                        onClick={() => router.push("/interview-prep")}
                                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                    >
                                        <Building className="w-4 h-4 mr-2" />
                                        Start Interview Prep
                                    </Button>
                                    <div className="text-center py-4">
                                        <Building className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-white mb-2">Ready to Practice?</h3>
                                        <p className="text-slate-400">Access company-specific questions and interview scenarios.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Audio Interview Card */}
                        <Card
                            className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm cursor-pointer hover:bg-slate-700/50 transition"
                            onClick={() => router.push("/interview")}
                        >
                            <CardHeader>
                                <CardTitle className="text-white flex items-center">
                                    <Lightbulb className="w-5 h-5 mr-2" />
                                    Audio - Interview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-4">
                                    <Lightbulb className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-white mb-2">Practice with Audio Questions</h3>
                                    <p className="text-slate-400">Simulate real interview scenarios with audio-based questions.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Modal or inline rendering for InterviewPrep */}
                        {showAudioInterview && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                                <div className="bg-slate-900 rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
                                    <button
                                        className="absolute top-3 right-3 text-slate-400 hover:text-white"
                                        onClick={() => setShowAudioInterview(false)}
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                    <InterviewPrep />
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
            {/* Upgrade Success Notification */}
            {showUpgradeNotification && (
                <UpgradeSuccessNotification
                    show={showUpgradeNotification}
                    tier={upgradedTier}
                    onClose={() => setShowUpgradeNotification(false)}
                />
            )}

            {/* Navigation Header */}
            <nav className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-950/80 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                                LeetFriends
                            </h1>
                            {user?.name && (
                                <div className="hidden sm:block text-slate-400 text-sm">
                                    Welcome back, {user.name.split(' ')[0]}!
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Desktop Navigation */}
                            <div className="hidden md:flex items-center space-x-3">
                                {currentTier.level === 'free' && (
                                    <Button
                                        onClick={() => router.push("/pricing")}
                                        size="sm"
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                    >
                                        <Crown className="w-4 h-4 mr-2" />
                                        Upgrade
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push("/settings")}
                                    className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleLogout}
                                    className="bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-400"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout
                                </Button>
                            </div>

                            {/* Mobile Menu Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden text-slate-400 hover:text-white"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden border-t border-slate-800/50 py-4 space-y-2">
                            {currentTier.level === 'free' && (
                                <Button
                                    onClick={() => {
                                        router.push("/pricing");
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                >
                                    <Crown className="w-4 h-4 mr-2" />
                                    Upgrade
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => {
                                    router.push("/settings");
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleLogout}
                                className="w-full bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-400"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    )}
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
                {/* Header */}
                <div className="mb-6 lg:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h2>
                            <p className="text-slate-400 mt-1 text-sm lg:text-base">
                                Track your progress, compete with friends, and improve your coding skills
                            </p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        {/* Desktop Tabs */}
                        <div className="hidden sm:flex space-x-1 bg-slate-800/50 rounded-lg p-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => !tab.locked && setActiveTab(tab.id as TabType)}
                                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                        ? 'bg-purple-600 text-white'
                                        : tab.locked
                                            ? 'text-slate-500 cursor-not-allowed'
                                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                        }`}
                                    disabled={tab.locked}
                                >
                                    <tab.icon className="w-4 h-4 mr-2" />
                                    {tab.name}
                                    {tab.locked && <Lock className="w-3 h-3 ml-2" />}
                                </button>
                            ))}
                        </div>

                        {/* Mobile Tabs */}
                        <div className="sm:hidden">
                            <div className="grid grid-cols-2 gap-2">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => !tab.locked && setActiveTab(tab.id as TabType)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-lg text-xs font-medium transition-all duration-200 ${activeTab === tab.id
                                            ? 'bg-purple-600 text-white'
                                            : tab.locked
                                                ? 'bg-slate-800/30 text-slate-500 cursor-not-allowed'
                                                : 'bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-700/50'
                                            }`}
                                        disabled={tab.locked}
                                    >
                                        <div className="relative">
                                            <tab.mobileIcon className="w-5 h-5 mb-1" />
                                            {tab.locked && (
                                                <Lock className="w-3 h-3 absolute -top-1 -right-1 text-slate-500" />
                                            )}
                                        </div>
                                        <span className="truncate w-full text-center">
                                            {tab.name.replace(' ', '\n')}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {renderTabContent()}
                </motion.div>
            </div>
        </div>
    );
}