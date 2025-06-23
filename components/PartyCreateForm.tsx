"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Eye,
    EyeOff,
    Loader,
    Lock,
    Plus,
    Settings
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface UserProfile {
    handle: string;
    leetcodeUsername: string;
    displayName: string;
    initialStats: any;
    currentStats: any;
}

interface PartyCreateFormProps {
    userProfile: UserProfile;
}

export default function PartyCreateForm({ userProfile }: PartyCreateFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [partyName, setPartyName] = useState("");
    const [password, setPassword] = useState("");
    const [maxMembers, setMaxMembers] = useState<number>(10);
    const [enableMemberLimit, setEnableMemberLimit] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/party/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    partyName: partyName.trim(),
                    password: password || null,
                    maxMembers: enableMemberLimit ? maxMembers : null,
                    // User info is already stored in their profile
                }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(`Party "${partyName}" created successfully! Code: ${data.partyCode}`);
                router.push(`/party/${data.partyCode}`);
            } else {
                toast.error(data.error || "Failed to create party");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 py-8">
            <div className="max-w-2xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-slate-400 hover:text-white mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Create New Party
                    </h1>
                    <p className="text-slate-400">
                        Set up a new LeetCode competition party for you and your friends
                    </p>
                </div>

                {/* User Info Preview */}
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">{userProfile.displayName}</p>
                                <p className="text-slate-400 text-sm">@{userProfile.handle} • LeetCode: {userProfile.leetcodeUsername}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-bold">{userProfile.currentStats?.total || 0}</p>
                                <p className="text-slate-400 text-xs">Problems Solved</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Form */}
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center">
                            <Settings className="w-5 h-5 mr-2" />
                            Party Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Party Name */}
                            <div>
                                <Label htmlFor="partyName" className="text-slate-300">
                                    Party Name *
                                </Label>
                                <Input
                                    id="partyName"
                                    value={partyName}
                                    onChange={(e) => setPartyName(e.target.value)}
                                    placeholder="Give your party a cool name"
                                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                                    required
                                />
                            </div>

                            {/* Member Limit Setting */}
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="enableLimit"
                                        checked={enableMemberLimit}
                                        onChange={(e) => setEnableMemberLimit(e.target.checked)}
                                        className="w-4 h-4 text-purple-600 bg-slate-900 border-slate-600 rounded focus:ring-purple-500"
                                    />
                                    <Label htmlFor="enableLimit" className="text-slate-300">
                                        Set member limit
                                    </Label>
                                </div>
                                
                                {enableMemberLimit && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="ml-7"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Input
                                                type="number"
                                                value={maxMembers}
                                                onChange={(e) => setMaxMembers(Math.max(2, parseInt(e.target.value) || 2))}
                                                min="2"
                                                max="100"
                                                className="w-24 bg-slate-900/50 border-slate-600 text-white"
                                            />
                                            <span className="text-slate-400 text-sm">
                                                maximum members (2-100)
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Password Field */}
                            <div>
                                <Label htmlFor="password" className="text-slate-300 flex items-center">
                                    <Lock className="w-4 h-4 mr-2" />
                                    Party Password (optional)
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Optional password for your party"
                                        className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Leave empty to create a public party, or set a password for privacy
                                </p>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={loading || !partyName.trim()}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-12 text-lg font-medium"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <Loader className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Creating Party...
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <Plus className="w-5 h-5 mr-2" />
                                        Create Party
                                    </div>
                                )}
                            </Button>

                            {/* Help Text */}
                            <div className="text-center pt-4 border-t border-slate-700">
                                <p className="text-slate-400 text-sm">
                                    Once created, share the party code with your friends to invite them!
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}