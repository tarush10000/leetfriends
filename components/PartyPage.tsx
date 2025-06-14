"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Users,
    Trophy,
    Copy,
    Crown,
    Calendar,
    Target,
    LogOut,
    Settings,
    RefreshCw,
    Share2,
    Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import GameMaster from "@/components/GameMaster";

interface PartyMember {
    email: string;
    handle: string;
    leetcodeUsername: string;
    displayName: string;
    joinedAt: string;
    isOwner: boolean;
    stats: {
        easy: number;
        medium: number;
        hard: number;
        total: number;
        lastUpdated?: string;
    };
    initialStats?: {
        easy: number;
        medium: number;
        hard: number;
        total: number;
        lastUpdated?: string;
    };
}

interface Party {
    _id: string;
    code: string;
    name: string;
    password: string | null;
    maxMembers: number | null;
    createdAt: string;
    createdBy: string;
    members: PartyMember[];
}

export default function PartyPage({ code }: { code: string }) {
    const [party, setParty] = useState<Party | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingStats, setUpdatingStats] = useState(false);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const [showGameMaster, setShowGameMaster] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();

    const fetchParty = async () => {
        try {
            const res = await fetch(`/api/party/${code}`);
            if (!res.ok) {
                if (res.status === 404) {
                    toast.error("Party not found");
                    router.push("/dashboard");
                    return;
                }
                throw new Error("Failed to fetch party");
            }
            const data = await res.json();
            setParty(data);
        } catch (error) {
            console.error("Error fetching party:", error);
            toast.error("Failed to load party");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchParty();
        if (session?.user?.email) {
            setCurrentUserEmail(session.user.email);
        }
    }, [code, session]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchParty();
    };

    const updateAllStats = async () => {
        setUpdatingStats(true);
        try {
            const response = await fetch("/api/leetcode/stats", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ partyCode: code }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                // Refresh the party data to show updated stats
                await fetchParty();
            } else {
                toast.error(data.error || "Failed to update stats");
            }
        } catch (error) {
            console.error("Error updating stats:", error);
            toast.error("Failed to update stats");
        } finally {
            setUpdatingStats(false);
        }
    };

    const updateMyStats = async () => {
        if (!party || !currentUserEmail) return;

        // Find current user's LeetCode username
        const currentMember = party.members.find(m => m.email === currentUserEmail);

        if (!currentMember) {
            toast.error("Could not find your member information");
            return;
        }

        setUpdatingStats(true);
        try {
            const response = await fetch("/api/leetcode/stats", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: currentMember.leetcodeUsername,
                    partyCode: code
                }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Your stats have been updated!");
                await fetchParty();
            } else {
                toast.error(data.error || "Failed to update your stats");
            }
        } catch (error) {
            console.error("Error updating stats:", error);
            toast.error("Failed to update your stats");
        } finally {
            setUpdatingStats(false);
        }
    };

    // Check if current user is the owner
    const isOwner = party?.members.find(m => m.email === currentUserEmail)?.isOwner || false;

    const copyPartyCode = () => {
        navigator.clipboard.writeText(code);
        toast.success("Party code copied to clipboard!");
    };

    const shareParty = () => {
        if (navigator.share) {
            navigator.share({
                title: `Join ${party?.name} on LeetFriends`,
                text: `Join my coding party: ${party?.name}`,
                url: window.location.href,
            });
        } else {
            copyPartyCode();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading party...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!party) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white mb-2">Party Not Found</h1>
                        <p className="text-slate-400 mb-6">The party you're looking for doesn't exist.</p>
                        <Button onClick={() => router.push("/dashboard")}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Sort members by problems solved since joining (descending)
    const sortedMembers = [...party.members].sort((a, b) => {
        const aProgress = Math.max(0, (a.stats?.total || 0) - (a.initialStats?.total || 0));
        const bProgress = Math.max(0, (b.stats?.total || 0) - (b.initialStats?.total || 0));
        return bProgress - aProgress;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
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
                            <div>
                                <h1 className="text-xl font-bold text-white">{party.name}</h1>
                                <p className="text-sm text-slate-400">Party Code: {party.code}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowGameMaster(true)}
                                className="border-purple-600 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Game Master
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={updateMyStats}
                                disabled={updatingStats}
                                className="border-green-600 bg-green-600/10 hover:bg-green-600/20 text-green-400"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${updatingStats ? 'animate-spin' : ''}`} />
                                Update My Stats
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={updateAllStats}
                                disabled={updatingStats}
                                className="border-blue-600 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${updatingStats ? 'animate-spin' : ''}`} />
                                Update All Stats
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={shareParty}
                                className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300"
                            >
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Party Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-300 text-sm font-medium">Total Members</p>
                                    <p className="text-3xl font-bold text-white">
                                        {party.members.length}
                                        {party.maxMembers && <span className="text-lg text-slate-400">/{party.maxMembers}</span>}
                                    </p>
                                </div>
                                <Users className="w-8 h-8 text-purple-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-300 text-sm font-medium">Party Code</p>
                                    <p className="text-2xl font-bold text-white font-mono">{party.code}</p>
                                    <p className="text-blue-400 text-sm">Share with friends</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={copyPartyCode}
                                    className="text-blue-400 hover:text-blue-300 p-2"
                                >
                                    <Copy className="w-6 h-6" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-300 text-sm font-medium">Top Performer</p>
                                    <p className="text-lg font-bold text-white truncate">
                                        {sortedMembers[0]?.displayName || "None"}
                                    </p>
                                    <p className="text-emerald-400 text-sm">
                                        +{Math.max(0, (sortedMembers[0]?.stats?.total || 0) - (sortedMembers[0]?.initialStats?.total || 0))} since joining
                                    </p>
                                </div>
                                <Trophy className="w-8 h-8 text-emerald-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-300 text-sm font-medium">Total Progress</p>
                                    <p className="text-2xl font-bold text-white">
                                        +{party.members.reduce((sum, member) => {
                                            const progress = Math.max(0, (member.stats?.total || 0) - (member.initialStats?.total || 0));
                                            return sum + progress;
                                        }, 0)}
                                    </p>
                                    <p className="text-orange-400 text-sm">Problems solved together</p>
                                </div>
                                <Sparkles className="w-8 h-8 text-orange-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Leaderboard */}
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center">
                            <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
                            Leaderboard
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="space-y-0">
                            <AnimatePresence>
                                {sortedMembers.map((member, index) => (
                                    <motion.div
                                        key={member.email}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`p-6 border-b border-slate-700/30 last:border-b-0 hover:bg-slate-700/20 transition-colors ${index === 0 ? 'bg-gradient-to-r from-yellow-500/5 to-orange-500/5' : ''
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500 text-black' :
                                                    index === 1 ? 'bg-slate-400 text-black' :
                                                        index === 2 ? 'bg-amber-600 text-white' :
                                                            'bg-slate-700 text-slate-300'
                                                    }`}>
                                                    {index === 0 ? '🏆' : index + 1}
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="text-lg font-semibold text-white">
                                                            {member.displayName}
                                                        </h3>
                                                        {member.isOwner && (
                                                            <Crown className="w-4 h-4 text-yellow-500" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-400">
                                                        @{member.handle} • LeetCode: {member.leetcodeUsername}
                                                    </p>
                                                    <p className="text-xs text-slate-500 flex items-center mt-1">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-white mb-1">
                                                    {member.stats.total}
                                                </p>
                                                <div className="flex space-x-4 text-sm">
                                                    <span className="text-green-400">
                                                        E: {member.stats.easy}
                                                    </span>
                                                    <span className="text-yellow-400">
                                                        M: {member.stats.medium}
                                                    </span>
                                                    <span className="text-red-400">
                                                        H: {member.stats.hard}
                                                    </span>
                                                </div>
                                                {member.stats.lastUpdated && (
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Updated {new Date(member.stats.lastUpdated).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </CardContent>
                </Card>

                {/* Game Master Modal */}
                <AnimatePresence>
                    {showGameMaster && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowGameMaster(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-slate-900 rounded-xl border border-slate-700 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                            <Sparkles className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">Game Master</h2>
                                            <p className="text-slate-400 text-sm">AI-powered coding challenges and assistance</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowGameMaster(false)}
                                        className="text-slate-400 hover:text-white"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </Button>
                                </div>
                                <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                                    <GameMaster
                                        partyCode={code}
                                        isOwner={isOwner}
                                        currentUserEmail={currentUserEmail || undefined}
                                        currentUserName={(() => {
                                            const currentMember = party?.members.find(m => m.email === currentUserEmail);
                                            return currentMember?.displayName || currentMember?.handle || undefined;
                                        })()}
                                    />
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Party Info */}
                <div className="mt-8 text-center">
                    <p className="text-slate-400 text-sm">
                        Party created on {new Date(party.createdAt).toLocaleDateString()}
                        {party.maxMembers && (
                            <span className="ml-2">
                                • Limited to {party.maxMembers} members
                            </span>
                        )}
                        {party.password && (
                            <span className="ml-2">• Password protected</span>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}