"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    Crown,
    Lock,
    LogIn,
    Shield,
    UserPlus,
    Users
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface PartyInfo {
    code: string;
    name: string;
    memberCount: number;
    maxMembers: number | null;
    hasPassword: boolean;
    createdAt: string;
}

interface UserProfile {
    handle: string;
    leetcodeUsername: string;
    displayName: string;
    initialStats: any;
    currentStats: any;
}

interface PartyJoinPromptProps {
    partyInfo: PartyInfo;
    userProfile: UserProfile;
}

export default function PartyJoinPrompt({ partyInfo, userProfile }: PartyJoinPromptProps) {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const joinParty = async () => {
        if (partyInfo.hasPassword && !password.trim()) {
            toast.error("Please enter the party password");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/party/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: partyInfo.code,
                    password: password.trim() || null
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                toast.success(data.message || `Successfully joined "${partyInfo.name}"!`);
                // Refresh the page to show the party content
                router.refresh();
            } else {
                toast.error(data.error || "Failed to join party");
            }
        } catch (error) {
            console.error("Error joining party:", error);
            toast.error("Error joining party");
        } finally {
            setLoading(false);
        }
    };

    const isPartyFull = partyInfo.maxMembers && partyInfo.memberCount >= partyInfo.maxMembers;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 text-white">
            {/* Navigation */}
            <nav className="p-6">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/dashboard" className="flex items-center text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                </div>
            </nav>

            <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 relative">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 max-w-md mx-auto"
                >
                    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UserPlus className="w-8 h-8 text-white" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-white mb-2">
                                Join Party
                            </CardTitle>
                            <p className="text-slate-400">
                                You've been invited to join a coding party!
                            </p>
                        </CardHeader>
                        
                        <CardContent className="space-y-6">
                            {/* Party Information */}
                            <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white">{partyInfo.name}</h3>
                                    <div className="flex items-center text-slate-400 text-sm">
                                        <Crown className="w-4 h-4 mr-1" />
                                        {partyInfo.code}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center text-slate-300">
                                        <Users className="w-4 h-4 mr-2 text-purple-400" />
                                        {partyInfo.memberCount}
                                        {partyInfo.maxMembers && ` / ${partyInfo.maxMembers}`} members
                                    </div>
                                    <div className="flex items-center text-slate-300">
                                        <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                                        {new Date(partyInfo.createdAt).toLocaleDateString()}
                                    </div>
                                </div>

                                {partyInfo.hasPassword && (
                                    <div className="flex items-center text-yellow-400 text-sm">
                                        <Lock className="w-4 h-4 mr-2" />
                                        Password protected
                                    </div>
                                )}
                            </div>

                            {/* Party Full Warning */}
                            {isPartyFull && (
                                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                                    <div className="flex items-center text-red-400 mb-2">
                                        <AlertCircle className="w-5 h-5 mr-2" />
                                        <span className="font-semibold">Party is Full</span>
                                    </div>
                                    <p className="text-red-300 text-sm">
                                        This party has reached its maximum capacity of {partyInfo.maxMembers} members.
                                    </p>
                                </div>
                            )}

                            {/* Password Input */}
                            {partyInfo.hasPassword && !isPartyFull && (
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Party Password</Label>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter party password"
                                        className="bg-slate-700/50 border-slate-600 text-white"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !loading) {
                                                joinParty();
                                            }
                                        }}
                                    />
                                </div>
                            )}

                            {/* User Info Preview */}
                            <div className="bg-slate-700/20 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">Joining as:</h4>
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-white font-bold">
                                            {userProfile.displayName.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{userProfile.displayName}</p>
                                        <p className="text-slate-400 text-sm">@{userProfile.handle}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                {!isPartyFull && (
                                    <Button
                                        onClick={joinParty}
                                        disabled={loading || (partyInfo.hasPassword && !password.trim())}
                                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Joining...
                                            </>
                                        ) : (
                                            <>
                                                <LogIn className="w-5 h-5 mr-2" />
                                                Join {partyInfo.name}
                                            </>
                                        )}
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    onClick={() => router.push('/dashboard')}
                                    className="w-full border-slate-600 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Dashboard
                                </Button>
                            </div>

                            {/* Security Note */}
                            <div className="text-center">
                                <div className="flex items-center justify-center text-slate-400 text-xs">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Secure party invitation
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}