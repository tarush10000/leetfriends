"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
    Plus, 
    Users, 
    LogOut, 
    Settings, 
    Crown, 
    Calendar, 
    TrendingUp,
    Target,
    Trophy,
    Star,
    BarChart3,
    Brain,
    Zap,
    Building
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import AchievementSystem from "@/components/AchievementSystem";
import AIRecommendations from "@/components/AIRecommendations";
import InterviewPrep from "@/components/InterviewPrep";

interface PartyPreview {
    name: string;
    code: string;
    memberCount: number;
    maxMembers?: number;
    createdAt: string;
    isOwner: boolean;
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
}

type TabType = 'overview' | 'achievements' | 'recommendations' | 'interview-prep';

export default function Dashboard({ user, userProfile }: DashboardProps) {
    const [parties, setParties] = useState<PartyPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const router = useRouter();

    useEffect(() => {
        fetch("/api/user/parties")
            .then((res) => res.json())
            .then((data) => {
                setParties(data || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/" });
    };

    const tabs = [
        {
            id: 'overview',
            name: 'Overview',
            icon: BarChart3,
        },
        {
            id: 'achievements',
            name: 'Achievements',
            icon: Trophy,
        },
        {
            id: 'recommendations',
            name: 'AI Insights',
            icon: Brain,
        },
        {
            id: 'interview-prep',
            name: 'Interview Prep',
            icon: Building,
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
            {/* Navigation Header */}
            <nav className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-950/80 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                                LeetFriends
                            </h1>
                            {user?.name && (
                                <div className="hidden sm:block text-slate-400 text-sm">
                                    Welcome back, {user.name.split(' ')[0]}!
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center space-x-3">
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
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-white">Dashboard</h2>
                            <p className="text-slate-400 mt-1">
                                Track your progress, compete with friends, and improve your coding skills
                            </p>
                        </div>
                        {activeTab === 'overview' && (
                            <div className="flex space-x-2">
                                <Button
                                    onClick={() => router.push("/party/create")}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Party
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push("/party/join")}
                                    className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300"
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    Join Party
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Tab Buttons */}
                    <div className="bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                        <div className="flex space-x-1">
                            {tabs.map((tab) => {
                                const IconComponent = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as TabType)}
                                        className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md transition-all duration-200 ${
                                            activeTab === tab.id
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                        }`}
                                    >
                                        <IconComponent className="w-4 h-4 mr-2" />
                                        <span className="font-medium">{tab.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 backdrop-blur-sm">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-green-300 text-sm font-medium">Problems Solved</p>
                                                    <p className="text-3xl font-bold text-white">
                                                        {userProfile?.currentStats?.total || 0}
                                                    </p>
                                                    <div className="flex space-x-3 text-xs mt-2">
                                                        <span className="text-green-400">Easy: {userProfile?.currentStats?.easy || 0}</span>
                                                        <span className="text-yellow-400">Medium: {userProfile?.currentStats?.medium || 0}</span>
                                                        <span className="text-red-400">Hard: {userProfile?.currentStats?.hard || 0}</span>
                                                    </div>
                                                </div>
                                                <Target className="w-12 h-12 text-green-400" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 backdrop-blur-sm">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-purple-300 text-sm font-medium">Active Parties</p>
                                                    <p className="text-3xl font-bold text-white">{parties.length}</p>
                                                    <p className="text-xs text-slate-400 mt-2">
                                                        {parties.filter(p => p.isOwner).length} owned
                                                    </p>
                                                </div>
                                                <Users className="w-12 h-12 text-purple-400" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20 backdrop-blur-sm">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-blue-300 text-sm font-medium">Profile</p>
                                                    <p className="text-lg font-bold text-white truncate">
                                                        @{userProfile?.handle}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-2">
                                                        LeetCode: {userProfile?.leetcodeUsername}
                                                    </p>
                                                </div>
                                                <Star className="w-12 h-12 text-blue-400" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </div>

                            {/* Parties Grid */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-white">Your Parties</h3>
                                    {parties.length > 0 && (
                                        <p className="text-slate-400 text-sm">
                                            {parties.length} active {parties.length === 1 ? 'party' : 'parties'}
                                        </p>
                                    )}
                                </div>

                                {loading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="animate-pulse">
                                                <Card className="bg-slate-800/50 border-slate-700/50">
                                                    <CardContent className="p-6">
                                                        <div className="h-4 bg-slate-700 rounded mb-4"></div>
                                                        <div className="h-3 bg-slate-700 rounded mb-2"></div>
                                                        <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        ))}
                                    </div>
                                ) : parties.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <AnimatePresence>
                                            {parties.map((party, index) => (
                                                <motion.div
                                                    key={party.code}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    onClick={() => router.push(`/party/${party.code}`)}
                                                    className="cursor-pointer"
                                                >
                                                    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 group">
                                                        <CardContent className="p-6">
                                                            <div className="flex items-start justify-between mb-4">
                                                                <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                                                                    {party.name}
                                                                </h4>
                                                                {party.isOwner && (
                                                                    <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                                                )}
                                                            </div>
                                                            
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <div className="flex items-center text-slate-400">
                                                                        <Users className="w-4 h-4 mr-2" />
                                                                        <span>{party.memberCount} members</span>
                                                                        {party.maxMembers && (
                                                                            <span className="text-slate-500 ml-1">
                                                                                / {party.maxMembers}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-slate-500 text-xs">
                                                                        {party.code}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="flex items-center text-xs text-slate-500">
                                                                    <Calendar className="w-3 h-3 mr-1" />
                                                                    Created {new Date(party.createdAt).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                                            <CardContent className="p-12 text-center">
                                                <Users className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                                                <h3 className="text-xl font-semibold text-white mb-2">No Parties Yet</h3>
                                                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                                                    Create your first party or join an existing one to start competing with friends!
                                                </p>
                                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                                    <Button
                                                        onClick={() => router.push("/party/create")}
                                                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Create Party
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => router.push("/party/join")}
                                                        className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300"
                                                    >
                                                        <Users className="w-4 h-4 mr-2" />
                                                        Join Party
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'achievements' && (
                        <motion.div
                            key="achievements"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <AchievementSystem userEmail={user?.email || ''} />
                        </motion.div>
                    )}

                    {activeTab === 'recommendations' && (
                        <motion.div
                            key="recommendations"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <AIRecommendations 
                                userProfile={userProfile || {
                                    handle: '',
                                    leetcodeUsername: '',
                                    displayName: '',
                                    onboarded: false
                                }} 
                                leetcodeStats={userProfile?.currentStats || {
                                    easy: 0,
                                    medium: 0,
                                    hard: 0,
                                    total: 0
                                }} 
                            />
                        </motion.div>
                    )}

                    {activeTab === 'interview-prep' && (
                        <motion.div
                            key="interview-prep"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <InterviewPrep userEmail={user?.email || ''} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}