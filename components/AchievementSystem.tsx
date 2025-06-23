"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import {
    Calendar,
    CheckCircle,
    Clock,
    Crown,
    Flame,
    Lock,
    RefreshCw,
    Star,
    Target,
    Trophy,
    Users
} from "lucide-react";
import { useEffect, useState } from "react";

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    tier: string;
    requirement: number;
    rarity: string;
    xpReward: number;
    currentProgress: number;
    isUnlocked: boolean;
    unlockedAt?: string;
}

interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastSubmissionDate: string | null;
    lastUpdated: string | null;
    cacheAge: number;
}

interface Stats {
    totalProblems: number;
    easyProblems: number;
    mediumProblems: number;
    hardProblems: number;
    partiesJoined: number;
    partiesCreated: number;
}

interface AchievementSystemProps {
    userEmail: string;
}

const iconMap = {
    'trophy': Trophy,
    'crown': Crown,
    'target': Target,
    'users': Users,
    'flame': Flame,
    'star': Star
};

const tierColors = {
    'bronze': 'from-amber-700 to-amber-600',
    'silver': 'from-slate-400 to-slate-500',
    'gold': 'from-yellow-400 to-yellow-500',
    'platinum': 'from-cyan-400 to-cyan-500',
    'diamond': 'from-blue-400 to-purple-500'
};

const rarityColors = {
    'common': 'border-gray-500/30 bg-gray-500/10',
    'rare': 'border-blue-500/30 bg-blue-500/10',
    'epic': 'border-purple-500/30 bg-purple-500/10',
    'legendary': 'border-yellow-500/30 bg-yellow-500/10'
};

export default function AchievementSystem({ userEmail }: AchievementSystemProps) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [streakData, setStreakData] = useState<StreakData | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [totalXP, setTotalXP] = useState(0);
    const [level, setLevel] = useState(1);
    const [nextLevelXP, setNextLevelXP] = useState(1000);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [filter, setFilter] = useState<string>('all');

    const fetchAchievements = async () => {
        try {
            const response = await fetch(`/api/achievements/${encodeURIComponent(userEmail)}`);
            if (response.ok) {
                const data = await response.json();
                setAchievements(data.achievements);
                setStreakData(data.streakData);
                setStats(data.stats);
                setTotalXP(data.totalXP);
                setLevel(data.level);
                setNextLevelXP(data.nextLevelXP);
            }
        } catch (error) {
            console.error("Failed to fetch achievements:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStreak = async () => {
        setUpdating(true);
        try {
            const response = await fetch(`/api/achievements/${encodeURIComponent(userEmail)}`, {
                method: 'POST'
            });
            
            if (response.ok) {
                const data = await response.json();
                // Refresh all data after successful update
                await fetchAchievements();
                
                // Show success message or toast here if needed
                console.log("Streak updated successfully:", data.streakData);
            } else {
                console.error("Failed to update streak");
            }
        } catch (error) {
            console.error("Error updating streak:", error);
        } finally {
            setUpdating(false);
        }
    };

    useEffect(() => {
        fetchAchievements();
    }, [userEmail]);

    const filteredAchievements = achievements.filter(achievement => {
        if (filter === 'unlocked') return achievement.isUnlocked;
        if (filter === 'locked') return !achievement.isUnlocked;
        if (filter === 'all') return true;
        return achievement.category === filter;
    });

    const categories = ['all', 'unlocked', 'locked', 'streak', 'difficulty', 'social', 'milestone'];

    const formatLastUpdate = (lastUpdated: string | null, cacheAge: number) => {
        if (!lastUpdated) return "Never updated";
        
        if (cacheAge < 60) return "Just updated";
        if (cacheAge < 3600) return `${Math.floor(cacheAge / 60)} min ago`;
        if (cacheAge < 86400) return `${Math.floor(cacheAge / 3600)} hours ago`;
        return `${Math.floor(cacheAge / 86400)} days ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Streak Info and Update Button */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Level Progress */}
                <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Level {level}</h3>
                                <p className="text-purple-300 text-sm">{totalXP} / {nextLevelXP} XP</p>
                            </div>
                            <Star className="w-8 h-8 text-purple-400" />
                        </div>
                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                style={{ width: `${(totalXP / nextLevelXP) * 100}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Current Streak */}
                <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Current Streak</h3>
                                <p className="text-2xl font-bold text-orange-400">
                                    {streakData?.currentStreak || 0} days
                                </p>
                            </div>
                            <Flame className="w-8 h-8 text-orange-400" />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Longest: {streakData?.longestStreak || 0} days</span>
                            <span>{formatLastUpdate(streakData?.lastUpdated || null, streakData?.cacheAge || 0)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Update Button */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center justify-center h-full space-y-3">
                            <Button
                                onClick={updateStreak}
                                disabled={updating}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 w-full"
                            >
                                {updating ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Update Streak
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-slate-400 text-center">
                                Fetches latest data from LeetCode
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-slate-800/50 border-slate-700/50">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-400">{stats.totalProblems}</div>
                            <div className="text-xs text-slate-400">Total Solved</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700/50">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-400">{stats.partiesJoined}</div>
                            <div className="text-xs text-slate-400">Parties Joined</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700/50">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-purple-400">{stats.partiesCreated}</div>
                            <div className="text-xs text-slate-400">Parties Created</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700/50">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-400">
                                {achievements.filter(a => a.isUnlocked).length}
                            </div>
                            <div className="text-xs text-slate-400">Achievements</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Last Submission Info */}
            {streakData?.lastSubmissionDate && (
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Calendar className="w-5 h-5 text-blue-400" />
                                <div>
                                    <p className="text-white font-medium">Last LeetCode Submission</p>
                                    <p className="text-slate-400 text-sm">
                                        {new Date(streakData.lastSubmissionDate).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500">
                                    Data from LeetCode API
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                    <Button
                        key={category}
                        variant={filter === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter(category)}
                        className={filter === category ? 
                            "bg-purple-600 hover:bg-purple-700" : 
                            "border-slate-600 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300"
                        }
                    >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                        <Badge variant="secondary" className="ml-2 text-xs">
                            {category === 'all' ? achievements.length :
                             category === 'unlocked' ? achievements.filter(a => a.isUnlocked).length :
                             category === 'locked' ? achievements.filter(a => !a.isUnlocked).length :
                             achievements.filter(a => a.category === category).length}
                        </Badge>
                    </Button>
                ))}
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredAchievements.map((achievement, index) => {
                        const IconComponent = iconMap[achievement.icon as keyof typeof iconMap] || Trophy;
                        const progressPercentage = (achievement.currentProgress / achievement.requirement) * 100;
                        
                        return (
                            <motion.div
                                key={achievement.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                                    achievement.isUnlocked ? 
                                        `bg-gradient-to-br ${tierColors[achievement.tier as keyof typeof tierColors]} opacity-100` :
                                        'bg-slate-800/50 border-slate-700/50 opacity-75'
                                }`}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-3 rounded-lg ${
                                                    achievement.isUnlocked ? 
                                                        'bg-white/20' : 
                                                        'bg-slate-700/50'
                                                }`}>
                                                    {achievement.isUnlocked ? (
                                                        <IconComponent className="w-6 h-6 text-white" />
                                                    ) : (
                                                        <Lock className="w-6 h-6 text-slate-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <CardTitle className={`text-lg ${
                                                        achievement.isUnlocked ? 'text-white' : 'text-slate-300'
                                                    }`}>
                                                        {achievement.name}
                                                    </CardTitle>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <Badge 
                                                            variant="secondary" 
                                                            className={`text-xs ${rarityColors[achievement.rarity as keyof typeof rarityColors]}`}
                                                        >
                                                            {achievement.rarity}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {achievement.xpReward} XP
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            {achievement.isUnlocked && (
                                                <CheckCircle className="w-6 h-6 text-green-400" />
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className={`text-sm mb-4 ${
                                            achievement.isUnlocked ? 'text-white/80' : 'text-slate-400'
                                        }`}>
                                            {achievement.description}
                                        </p>
                                        
                                        {/* Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className={achievement.isUnlocked ? 'text-white/70' : 'text-slate-400'}>
                                                    Progress
                                                </span>
                                                <span className={achievement.isUnlocked ? 'text-white/70' : 'text-slate-400'}>
                                                    {achievement.currentProgress} / {achievement.requirement}
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                                <motion.div 
                                                    className={`h-full transition-all duration-1000 ${
                                                        achievement.isUnlocked ? 
                                                            'bg-gradient-to-r from-green-400 to-emerald-400' :
                                                            'bg-gradient-to-r from-slate-500 to-slate-400'
                                                    }`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                                    transition={{ delay: index * 0.1 + 0.5 }}
                                                />
                                            </div>
                                        </div>

                                        {achievement.isUnlocked && achievement.unlockedAt && (
                                            <div className="flex items-center space-x-1 mt-3 text-xs text-white/60">
                                                <Clock className="w-3 h-3" />
                                                <span>
                                                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>

                                    {/* Unlock Animation Overlay */}
                                    {achievement.isUnlocked && (
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute top-2 right-2">
                                                <motion.div
                                                    initial={{ scale: 0, rotate: -180 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    transition={{ delay: index * 0.1 + 0.8, duration: 0.5 }}
                                                >
                                                    <Trophy className="w-5 h-5 text-yellow-400" />
                                                </motion.div>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {filteredAchievements.length === 0 && (
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-8 text-center">
                        <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">No Achievements Found</h3>
                        <p className="text-slate-400">Try a different filter to see more achievements.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}