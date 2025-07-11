"use client";
import GameMaster from "@/components/GameMaster";
import PartyAnalytics from '@/components/PartyAnalytics';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertTriangle,
    ArrowLeft,
    BarChart3,
    Brain,
    Calendar,
    Copy,
    Crown,
    LogOut,
    MoreVertical,
    RefreshCw,
    Save,
    Settings,
    Share2,
    Sparkles,
    Target,
    Trophy,
    Users,
    UserX,
    X
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

type TabType = 'overview' | 'analytics' | 'gamemaster';

const tabs = [
    {
        id: 'overview',
        name: 'Overview',
        icon: Users,
        description: 'Members and leaderboard'
    },
    {
        id: 'analytics',
        name: 'Analytics',
        icon: BarChart3,
        description: 'Party statistics and trends'
    },
    {
        id: 'gamemaster',
        name: 'Game Master',
        icon: Brain,
        description: 'AI challenges and competitions'
    }
];

interface UserProfileProps {
    member: PartyMember;
    onClose: () => void;
}

function UserProfileModal({ member, onClose }: UserProfileProps) {
    const solvedAfterJoining = {
        easy: Math.max(0, member.stats.easy - (member.initialStats?.easy || 0)),
        medium: Math.max(0, member.stats.medium - (member.initialStats?.medium || 0)),
        hard: Math.max(0, member.stats.hard - (member.initialStats?.hard || 0)),
        total: Math.max(0, member.stats.total - (member.initialStats?.total || 0))
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 rounded-2xl border border-slate-700 p-4 sm:p-6 max-w-md w-full mx-4"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-bold text-sm sm:text-base">
                                {member.displayName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">{member.displayName}</h3>
                            <p className="text-slate-400 text-sm">@{member.handle}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {member.isOwner && (
                            <Crown className="w-5 h-5 text-yellow-500" />
                        )}
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <Label className="text-slate-300 text-sm">LeetCode Username</Label>
                        <p className="text-white">{member.leetcodeUsername}</p>
                    </div>

                    <div>
                        <Label className="text-slate-300 text-sm">Member Since</Label>
                        <p className="text-white">{new Date(member.joinedAt).toLocaleDateString()}</p>
                    </div>

                    <div>
                        <Label className="text-slate-300 text-sm">Total Problems Solved</Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                            <div className="text-center p-2 bg-slate-700/50 rounded">
                                <div className="text-white font-bold text-sm sm:text-base">{member.stats.total}</div>
                                <div className="text-xs text-slate-400">Total</div>
                            </div>
                            <div className="text-center p-2 bg-green-500/20 rounded">
                                <div className="text-green-400 font-bold text-sm sm:text-base">{member.stats.easy}</div>
                                <div className="text-xs text-green-400">Easy</div>
                            </div>
                            <div className="text-center p-2 bg-yellow-500/20 rounded">
                                <div className="text-yellow-400 font-bold text-sm sm:text-base">{member.stats.medium}</div>
                                <div className="text-xs text-yellow-400">Medium</div>
                            </div>
                            <div className="text-center p-2 bg-red-500/20 rounded">
                                <div className="text-red-400 font-bold text-sm sm:text-base">{member.stats.hard}</div>
                                <div className="text-xs text-red-400">Hard</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label className="text-slate-300 text-sm">Solved After Joining Party</Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                            <div className="text-center p-2 bg-purple-500/20 rounded">
                                <div className="text-purple-400 font-bold text-sm sm:text-base">{solvedAfterJoining.total}</div>
                                <div className="text-xs text-purple-400">Total</div>
                            </div>
                            <div className="text-center p-2 bg-green-500/10 rounded">
                                <div className="text-green-400 font-bold text-sm sm:text-base">{solvedAfterJoining.easy}</div>
                                <div className="text-xs text-green-400">Easy</div>
                            </div>
                            <div className="text-center p-2 bg-yellow-500/10 rounded">
                                <div className="text-yellow-400 font-bold text-sm sm:text-base">{solvedAfterJoining.medium}</div>
                                <div className="text-xs text-yellow-400">Medium</div>
                            </div>
                            <div className="text-center p-2 bg-red-500/10 rounded">
                                <div className="text-red-400 font-bold text-sm sm:text-base">{solvedAfterJoining.hard}</div>
                                <div className="text-xs text-red-400">Hard</div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

interface PartySettingsProps {
    party: Party;
    onClose: () => void;
    onUpdate: () => void;
}

function PartySettingsModal({ party, onClose, onUpdate }: PartySettingsProps) {
    const [partyName, setPartyName] = useState(party.name);
    const [password, setPassword] = useState('');
    const [maxMembers, setMaxMembers] = useState(party.maxMembers || 10);
    const [enableMemberLimit, setEnableMemberLimit] = useState(!!party.maxMembers);
    const [loading, setLoading] = useState(false);
    const [showKickConfirm, setShowKickConfirm] = useState<string | null>(null);

    const updatePartySettings = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/party/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partyCode: party.code,
                    partyName: partyName.trim(),
                    password: password.trim() || null,
                    maxMembers: enableMemberLimit ? maxMembers : null
                })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Party settings updated!');
                onUpdate();
                onClose();
            } else {
                toast.error(data.error || 'Failed to update settings');
            }
        } catch (error) {
            toast.error('Error updating party settings');
        } finally {
            setLoading(false);
        }
    };

    const kickMember = async (memberEmail: string) => {
        setLoading(true);
        try {
            const response = await fetch('/api/party/kick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partyCode: party.code,
                    memberEmail
                })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Member removed from party');
                onUpdate();
                setShowKickConfirm(null);
            } else {
                toast.error(data.error || 'Failed to remove member');
            }
        } catch (error) {
            toast.error('Error removing member');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 rounded-2xl border border-slate-700 p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
                        <Settings className="w-5 h-5 mr-2" />
                        Party Settings
                    </h2>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* Basic Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Basic Settings</h3>

                        <div>
                            <Label className="text-slate-300">Party Name</Label>
                            <Input
                                value={partyName}
                                onChange={(e) => setPartyName(e.target.value)}
                                className="bg-slate-700/50 border-slate-600 text-white"
                            />
                        </div>

                        <div>
                            <Label className="text-slate-300">Password (leave empty to remove)</Label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={party.password ? "Enter new password" : "No password set"}
                                className="bg-slate-700/50 border-slate-600 text-white"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={enableMemberLimit}
                                onChange={(e) => setEnableMemberLimit(e.target.checked)}
                                className="rounded"
                            />
                            <Label className="text-slate-300">Enable member limit</Label>
                        </div>

                        {enableMemberLimit && (
                            <div>
                                <Label className="text-slate-300">Max Members</Label>
                                <Input
                                    type="number"
                                    value={maxMembers}
                                    onChange={(e) => setMaxMembers(parseInt(e.target.value) || 10)}
                                    min="2"
                                    max="50"
                                    className="bg-slate-700/50 border-slate-600 text-white"
                                />
                            </div>
                        )}

                        <Button
                            onClick={updatePartySettings}
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Settings
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Member Management */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Member Management</h3>

                        <div className="space-y-2">
                            {party.members.map((member) => (
                                <div
                                    key={member.email}
                                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                                >
                                    <div className="flex items-center min-w-0 flex-1">
                                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                            <span className="text-white text-sm font-bold">
                                                {member.displayName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center">
                                                <span className="text-white font-medium truncate">{member.displayName}</span>
                                                {member.isOwner && (
                                                    <Crown className="w-4 h-4 text-yellow-500 ml-2 flex-shrink-0" />
                                                )}
                                            </div>
                                            <span className="text-slate-400 text-sm truncate">@{member.handle}</span>
                                        </div>
                                    </div>

                                    {!member.isOwner && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowKickConfirm(member.email)}
                                            className="border-red-500/50 text-red-400 hover:bg-red-500/20 ml-2 flex-shrink-0"
                                        >
                                            <UserX className="w-4 h-4 sm:mr-1" />
                                            <span className="hidden sm:inline">Remove</span>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Kick Confirmation Modal */}
                <AnimatePresence>
                    {showKickConfirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-slate-800 rounded-xl border border-red-500/50 p-4 sm:p-6 max-w-md w-full mx-4"
                            >
                                <div className="text-center">
                                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-white mb-2">Remove Member</h3>
                                    <p className="text-slate-400 mb-6">
                                        Are you sure you want to remove this member from the party? This action cannot be undone.
                                    </p>
                                    <div className="flex space-x-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowKickConfirm(null)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={() => kickMember(showKickConfirm)}
                                            disabled={loading}
                                            className="flex-1 bg-red-600 hover:bg-red-700"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}

// Mobile Action Menu Component
interface MobileMenuProps {
    isOwner: boolean;
    onUpdateAllStats: () => void;
    onRefresh: () => void;
    onShare: () => void;
    onSettings: () => void;
    onLeave: () => void;
    updatingStats: boolean;
    refreshing: boolean;
    statsUpdateCooldown: number;
}

function MobileActionMenu({ 
    isOwner, 
    onUpdateAllStats, 
    onRefresh, 
    onShare, 
    onSettings, 
    onLeave,
    updatingStats,
    refreshing,
    statsUpdateCooldown
}: MobileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2"
            >
                <MoreVertical className="w-5 h-5" />
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div 
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        
                        {/* Menu */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-lg border border-slate-700 shadow-xl z-50"
                        >
                            <div className="py-2">
                                {isOwner && (
                                    <button
                                        onClick={() => {
                                            onUpdateAllStats();
                                            setIsOpen(false);
                                        }}
                                        disabled={updatingStats || statsUpdateCooldown > 0}
                                        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 flex items-center disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-4 h-4 mr-2 ${updatingStats ? 'animate-spin' : ''}`} />
                                        {statsUpdateCooldown > 0 ? `${statsUpdateCooldown}s` : 'Update All Stats'}
                                    </button>
                                )}
                                
                                <button
                                    onClick={() => {
                                        onRefresh();
                                        setIsOpen(false);
                                    }}
                                    disabled={refreshing}
                                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 flex items-center disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                                
                                <button
                                    onClick={() => {
                                        onShare();
                                        setIsOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 flex items-center"
                                >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share
                                </button>
                                
                                {isOwner && (
                                    <button
                                        onClick={() => {
                                            onSettings();
                                            setIsOpen(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 flex items-center"
                                    >
                                        <Settings className="w-4 h-4 mr-2" />
                                        Settings
                                    </button>
                                )}
                                
                                <div className="border-t border-slate-700 my-1"></div>
                                
                                <button
                                    onClick={() => {
                                        onLeave();
                                        setIsOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Leave Party
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function PartyPage({ code }: { code: string }) {
    const [party, setParty] = useState<Party | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingStats, setUpdatingStats] = useState(false);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const [selectedMember, setSelectedMember] = useState<PartyMember | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [statsUpdateCooldown, setStatsUpdateCooldown] = useState(0);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
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

    // Cooldown timer for stats updates
    useEffect(() => {
        if (statsUpdateCooldown > 0) {
            const timer = setTimeout(() => {
                setStatsUpdateCooldown(statsUpdateCooldown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [statsUpdateCooldown]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchParty();
    };

    const updateAllStats = async () => {
        if (statsUpdateCooldown > 0) {
            toast.error(`Please wait ${statsUpdateCooldown} seconds before updating stats again`);
            return;
        }

        setUpdatingStats(true);
        setStatsUpdateCooldown(300); // 5 minute cooldown
        
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
                await fetchParty();
            } else {
                toast.error(data.error || "Failed to update stats");
                setStatsUpdateCooldown(0);
            }
        } catch (error) {
            console.error("Error updating stats:", error);
            toast.error("Failed to update stats");
            setStatsUpdateCooldown(0);
        } finally {
            setUpdatingStats(false);
        }
    };

    const leaveParty = async () => {
        try {
            const response = await fetch('/api/party/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partyCode: code })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Left party successfully');
                router.push('/dashboard');
            } else {
                toast.error(data.error || 'Failed to leave party');
            }
        } catch (error) {
            toast.error('Error leaving party');
        }
    };

    const copyPartyCode = () => {
        navigator.clipboard.writeText(code);
        toast.success("Party code copied to clipboard!");
    };

    const shareParty = () => {
        if (navigator.share) {
            navigator.share({
                title: `Join ${party?.name} on LeetFriends!`,
                text: `Join our coding party: ${party?.name}`,
                url: window.location.href,
            });
        } else {
            copyPartyCode();
        }
    };

    // Calculate progress after joining for each member
    const getMemberProgress = (member: PartyMember) => {
        const solvedAfterJoining = {
            easy: Math.max(0, member.stats.easy - (member.initialStats?.easy || 0)),
            medium: Math.max(0, member.stats.medium - (member.initialStats?.medium || 0)),
            hard: Math.max(0, member.stats.hard - (member.initialStats?.hard || 0)),
            total: Math.max(0, member.stats.total - (member.initialStats?.total || 0))
        };
        return solvedAfterJoining;
    };

    // Sort members by progress after joining
    const sortedMembers = party?.members.slice().sort((a, b) => {
        const aProgress = getMemberProgress(a);
        const bProgress = getMemberProgress(b);
        return bProgress.total - aProgress.total;
    }) || [];

    const isOwner = party?.members.find(m => m.email === currentUserEmail)?.isOwner || false;

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
                    <div className="text-center px-4">
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
                                className="text-slate-400 hover:text-white"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                                    {party.name}
                                </h1>
                                <p className="text-slate-400 text-sm">
                                    Code: {party.code} • {party.members.length} members
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            {/* Desktop Actions */}
                            <div className="hidden lg:flex items-center space-x-3">
                                {isOwner && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={updateAllStats}
                                        disabled={updatingStats || statsUpdateCooldown > 0}
                                        className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300"
                                    >
                                        <RefreshCw className={`w-4 h-4 mr-2 ${updatingStats ? 'animate-spin' : ''}`} />
                                        {statsUpdateCooldown > 0 ? `${statsUpdateCooldown}s` : 'Update Stats'}
                                    </Button>
                                )}
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
                                {isOwner && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowSettings(true)}
                                        className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300"
                                    >
                                        <Settings className="w-4 h-4 mr-2" />
                                        Settings
                                    </Button>
                                )}
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setShowLeaveConfirm(true)}
                                    className="bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-400"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Leave
                                </Button>
                            </div>

                            {/* Mobile Actions */}
                            <div className="lg:hidden">
                                <MobileActionMenu
                                    isOwner={isOwner}
                                    onUpdateAllStats={updateAllStats}
                                    onRefresh={handleRefresh}
                                    onShare={shareParty}
                                    onSettings={() => setShowSettings(true)}
                                    onLeave={() => setShowLeaveConfirm(true)}
                                    updatingStats={updatingStats}
                                    refreshing={refreshing}
                                    statsUpdateCooldown={statsUpdateCooldown}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-white">Party Dashboard</h2>
                            <p className="text-slate-400 mt-1">
                                Track party progress, analyze performance, and compete with friends
                            </p>
                        </div>
                    </div>

                    {/* Tab Buttons */}
                    <div className="flex flex-wrap gap-2 sm:gap-4 border-b border-slate-700/50 pb-4">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                                        isActive
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                                            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="font-medium">{tab.name}</span>
                                </button>
                            );
                        })}
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
                            transition={{ duration: 0.3 }}
                        >
                            {/* Party Info Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
                                <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 backdrop-blur-sm">
                                    <CardContent className="p-3 sm:p-4 lg:p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-purple-300 text-xs sm:text-sm font-medium">Total Members</p>
                                                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                                                    {party.members.length}
                                                    {party.maxMembers && (
                                                        <span className="text-sm sm:text-base lg:text-lg text-slate-400">
                                                            /{party.maxMembers}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <Users className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-purple-400" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20 backdrop-blur-sm">
                                    <CardContent className="p-3 sm:p-4 lg:p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-blue-300 text-xs sm:text-sm font-medium">Created</p>
                                                <p className="text-sm sm:text-lg lg:text-xl font-bold text-white">
                                                    {new Date(party.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Calendar className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-400" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 backdrop-blur-sm">
                                    <CardContent className="p-3 sm:p-4 lg:p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-green-300 text-xs sm:text-sm font-medium">Problems Solved</p>
                                                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                                                    {party.members.reduce((sum, member) => sum + getMemberProgress(member).total, 0)}
                                                </p>
                                            </div>
                                            <Target className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-green-400" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20 backdrop-blur-sm">
                                    <CardContent className="p-3 sm:p-4 lg:p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-yellow-300 text-xs sm:text-sm font-medium">Party Code</p>
                                                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white font-mono">{party.code}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={copyPartyCode}
                                                className="text-yellow-400 hover:text-yellow-300 p-1"
                                            >
                                                <Copy className="w-5 h-5 sm:w-6 sm:h-6" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Leaderboard */}
                            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                                <CardHeader className="p-4 sm:p-6">
                                    <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                                        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-yellow-500" />
                                        Leaderboard - Problems Solved After Joining
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="space-y-0">
                                        <AnimatePresence>
                                            {sortedMembers.map((member, index) => {
                                                const progress = getMemberProgress(member);
                                                return (
                                                    <motion.div
                                                        key={member.email}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className={`p-3 sm:p-4 lg:p-6 border-b border-slate-700/30 last:border-b-0 hover:bg-slate-700/20 transition-colors cursor-pointer ${
                                                            index === 0 ? 'bg-gradient-to-r from-yellow-500/5 to-orange-500/5' : ''
                                                        }`}
                                                        onClick={() => setSelectedMember(member)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                                                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${
                                                                    index === 0 ? 'bg-yellow-500 text-black' :
                                                                    index === 1 ? 'bg-slate-400 text-black' :
                                                                    index === 2 ? 'bg-amber-600 text-white' :
                                                                    'bg-slate-700 text-slate-300'
                                                                }`}>
                                                                    {index === 0 ? '👑' : index + 1}
                                                                </div>
                                                                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                                        <span className="text-white font-bold text-xs sm:text-sm">
                                                                            {member.displayName.charAt(0).toUpperCase()}
                                                                        </span>
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center space-x-1 sm:space-x-2">
                                                                            <span className={`font-semibold text-sm sm:text-base truncate ${
                                                                                member.email === currentUserEmail ? 'text-purple-400' : 'text-white'
                                                                            }`}>
                                                                                {member.displayName}
                                                                                {member.email === currentUserEmail && (
                                                                                    <span className="text-purple-400 text-xs sm:text-sm ml-1">(You)</span>
                                                                                )}
                                                                            </span>
                                                                            {member.isOwner && <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />}
                                                                        </div>
                                                                        <p className="text-slate-400 text-xs sm:text-sm truncate">@{member.handle}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right flex-shrink-0">
                                                                <p className="text-xl sm:text-2xl font-bold text-white">
                                                                    {progress.total}
                                                                </p>
                                                                <div className="flex space-x-2 sm:space-x-4 text-xs sm:text-sm">
                                                                    <span className="text-green-400">
                                                                        E: {progress.easy}
                                                                    </span>
                                                                    <span className="text-yellow-400">
                                                                        M: {progress.medium}
                                                                    </span>
                                                                    <span className="text-red-400">
                                                                        H: {progress.hard}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-slate-500 mt-1">
                                                                    Total: {member.stats.total} problems
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {activeTab === 'analytics' && (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <PartyAnalytics partyCode={code} members={party.members} />
                        </motion.div>
                    )}

                    {activeTab === 'gamemaster' && (
                        <motion.div
                            key="gamemaster"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="min-h-[60vh]"
                        >
                            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                                <CardHeader className="p-4 sm:p-6 border-b border-slate-700/50">
                                    <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400" />
                                        Game Master
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <GameMaster
                                        partyCode={code}
                                        isOwner={isOwner}
                                        currentUserEmail={currentUserEmail || undefined}
                                        currentUserName={(() => {
                                            const currentMember = party?.members.find(m => m.email === currentUserEmail);
                                            return currentMember?.displayName || currentMember?.handle || undefined;
                                        })()}
                                    />
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {selectedMember && (
                    <UserProfileModal
                        member={selectedMember}
                        onClose={() => setSelectedMember(null)}
                    />
                )}

                {showSettings && isOwner && (
                    <PartySettingsModal
                        party={party}
                        onClose={() => setShowSettings(false)}
                        onUpdate={fetchParty}
                    />
                )}

                {showLeaveConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-slate-800 rounded-xl border border-red-500/50 p-4 sm:p-6 max-w-md w-full mx-4"
                        >
                            <div className="text-center">
                                <LogOut className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2">Leave Party</h3>
                                <p className="text-slate-400 mb-6">
                                    Are you sure you want to leave this party? You'll need a new invite to rejoin.
                                </p>
                                <div className="flex space-x-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowLeaveConfirm(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={leaveParty}
                                        className="flex-1 bg-red-600 hover:bg-red-700"
                                    >
                                        Leave Party
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}