"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users, LogOut, Settings, Crown, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

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
        onboarded: boolean;
        initialStats?: any;
        currentStats?: any;
    };
}

export default function Dashboard({ user, userProfile }: DashboardProps) {
    const [parties, setParties] = useState<PartyPreview[]>([]);
    const [loading, setLoading] = useState(true);
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

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-300 text-sm font-medium">Total Parties</p>
                                        <p className="text-3xl font-bold text-white">{parties.length}</p>
                                    </div>
                                    <Users className="w-8 h-8 text-purple-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-300 text-sm font-medium">Parties Owned</p>
                                        <p className="text-3xl font-bold text-white">
                                            {parties.filter(p => p.isOwner).length}
                                        </p>
                                    </div>
                                    <Crown className="w-8 h-8 text-blue-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-emerald-300 text-sm font-medium">Active Members</p>
                                        <p className="text-3xl font-bold text-white">
                                            {parties.reduce((sum, party) => sum + party.memberCount, 0)}
                                        </p>
                                    </div>
                                    <Users className="w-8 h-8 text-emerald-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <Button 
                        onClick={() => router.push("/party/create")}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        size="lg"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Create New Party
                    </Button>
                    <Button 
                        variant="outline"
                        onClick={() => router.push("/party/join")}
                        className="border-slate-600 bg-slate-800/30 hover:bg-slate-700/50 text-slate-300 backdrop-blur-sm"
                        size="lg"
                    >
                        <Users className="mr-2 h-5 w-5" />
                        Join Existing Party
                    </Button>
                </div>

                {/* Parties Grid */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white">Your Parties</h2>
                        {parties.length > 0 && (
                            <p className="text-slate-400 text-sm">
                                {parties.length} {parties.length === 1 ? 'party' : 'parties'}
                            </p>
                        )}
                    </div>

                    <AnimatePresence>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(3)].map((_, i) => (
                                    <Card key={i} className="bg-slate-800/30 border-slate-700/50 animate-pulse">
                                        <CardContent className="p-6">
                                            <div className="space-y-3">
                                                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                                                <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                                                <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : parties.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-12"
                            >
                                <div className="bg-slate-800/30 rounded-lg p-8 border border-slate-700/50 backdrop-blur-sm">
                                    <Users className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-slate-300 mb-2">No parties yet</h3>
                                    <p className="text-slate-500 mb-6">
                                        Create your first party or join an existing one to get started!
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <Button 
                                            onClick={() => router.push("/setup")}
                                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Party
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            onClick={() => router.push("/setup?mode=join")}
                                            className="border-slate-600 bg-slate-800/30 hover:bg-slate-700/50 text-slate-300"
                                        >
                                            <Users className="mr-2 h-4 w-4" />
                                            Join Party
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {parties.map((party, i) => (
                                    <motion.div
                                        key={party.code}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        whileHover={{ y: -4 }}
                                        className="group"
                                    >
                                        <Card 
                                            className="bg-slate-800/50 border-slate-700/50 cursor-pointer hover:border-purple-500/50 transition-all duration-300 backdrop-blur-sm group-hover:shadow-lg group-hover:shadow-purple-500/10"
                                            onClick={() => router.push(`/party/${party.code}`)}
                                        >
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                                                            {party.name}
                                                        </h3>
                                                        <p className="text-sm text-slate-400 font-mono">
                                                            {party.code}
                                                        </p>
                                                    </div>
                                                    {party.isOwner && (
                                                        <Crown className="w-5 h-5 text-yellow-500" />
                                                    )}
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center text-slate-400">
                                                            <Users className="w-4 h-4 mr-2" />
                                                            <span>{party.memberCount} members</span>
                                                        </div>
                                                        {party.maxMembers && (
                                                            <span className="text-slate-500">
                                                                / {party.maxMembers}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center text-xs text-slate-500">
                                                        <Calendar className="w-3 h-3 mr-2" />
                                                        Created {new Date(party.createdAt).toLocaleDateString()}
                                                    </div>
                                                    
                                                    {party.maxMembers && (
                                                        <div className="w-full bg-slate-700 rounded-full h-2">
                                                            <div 
                                                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                                                                style={{ 
                                                                    width: `${Math.min((party.memberCount / party.maxMembers) * 100, 100)}%` 
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}