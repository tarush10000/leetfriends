"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
    User, 
    Code, 
    Save, 
    RefreshCw, 
    ArrowLeft, 
    Settings as SettingsIcon,
    Shield,
    Trash2,
    CheckCircle,
    AlertCircle,
    Loader
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface UserProfile {
    handle: string;
    leetcodeUsername: string;
    displayName: string;
    initialStats: any;
    currentStats: any;
    onboardedAt: string;
    joinedParties: string[];
}

interface SettingsPageProps {
    initialProfile: UserProfile;
}

export default function SettingsPage({ initialProfile }: SettingsPageProps) {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [updatingStats, setUpdatingStats] = useState(false);
    
    // Form state
    const [handle, setHandle] = useState("");
    const [leetcodeUsername, setLeetcodeUsername] = useState("");
    const [isValidUsername, setIsValidUsername] = useState<boolean | null>(null);

    // Load user profile
    useEffect(() => {
        if (initialProfile) {
            setHandle(initialProfile.handle);
            setLeetcodeUsername(initialProfile.leetcodeUsername);
            setIsValidUsername(true);
        }
    }, [initialProfile]);

    const fetchProfile = async () => {
        // Profile is already loaded from server, just refresh if needed
        try {
            const response = await fetch("/api/user/profile");
            if (response.ok) {
                const data = await response.json();
                const updatedProfile = {
                    handle: data.handle || "",
                    leetcodeUsername: data.leetcodeUsername || "",
                    displayName: data.displayName || data.handle || "",
                    initialStats: data.initialStats || { easy: 0, medium: 0, hard: 0, total: 0 },
                    currentStats: data.currentStats || { easy: 0, medium: 0, hard: 0, total: 0 },
                    onboardedAt: data.onboardedAt || new Date().toISOString(),
                    joinedParties: data.joinedParties || []
                };
                setProfile(updatedProfile);
                setHandle(updatedProfile.handle);
                setLeetcodeUsername(updatedProfile.leetcodeUsername);
                setIsValidUsername(true);
            } else {
                toast.error("Failed to load profile");
            }
        } catch (error) {
            toast.error("Error loading profile");
        } finally {
            setLoading(false);
        }
    };

    // Verify LeetCode username
    const verifyLeetCodeUsername = async (username: string) => {
        if (!username.trim() || username === profile?.leetcodeUsername) {
            setIsValidUsername(true);
            return;
        }

        setVerifying(true);
        try {
            const response = await fetch("/api/leetcode/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username.trim() }),
            });

            const data = await response.json();
            if (response.ok && data.stats) {
                setIsValidUsername(true);
                toast.success("LeetCode profile verified!");
            } else {
                setIsValidUsername(false);
                toast.error("LeetCode username not found");
            }
        } catch (error) {
            setIsValidUsername(false);
            toast.error("Failed to verify LeetCode username");
        } finally {
            setVerifying(false);
        }
    };

    // Debounced verification
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (leetcodeUsername.length >= 3) {
                verifyLeetCodeUsername(leetcodeUsername);
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [leetcodeUsername]);

    const updateProfile = async () => {
        if (!isValidUsername) {
            toast.error("Please verify your LeetCode username first");
            return;
        }

        setSaving(true);
        try {
            const response = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    handle: handle.trim(),
                    leetcodeUsername: leetcodeUsername.trim(),
                }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Profile updated successfully!");
                setProfile(prev => prev ? { ...prev, handle, leetcodeUsername } : null);
            } else {
                toast.error(data.error || "Failed to update profile");
            }
        } catch (error) {
            toast.error("Error updating profile");
        } finally {
            setSaving(false);
        }
    };

    const updateCurrentStats = async () => {
        setUpdatingStats(true);
        try {
            const response = await fetch("/api/user/update-stats", {
                method: "POST",
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Stats updated successfully!");
                await fetchProfile();
            } else {
                toast.error(data.error || "Failed to update stats");
            }
        } catch (error) {
            toast.error("Error updating stats");
        } finally {
            setUpdatingStats(false);
        }
    };

    const deleteAccount = async () => {
        if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            return;
        }

        if (!confirm("This will remove you from all parties and delete all your data. Are you absolutely sure?")) {
            return;
        }

        try {
            const response = await fetch("/api/user/delete", {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("Account deleted successfully");
                await signOut({ callbackUrl: "/" });
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to delete account");
            }
        } catch (error) {
            toast.error("Error deleting account");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading settings...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
                    <p className="text-slate-400">Failed to load profile</p>
                    <Button onClick={() => router.push("/dashboard")} className="mt-4">
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

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
                            <h1 className="text-xl font-bold text-white flex items-center">
                                <SettingsIcon className="w-5 h-5 mr-2" />
                                Settings
                            </h1>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Settings */}
                    <div className="lg:col-span-2">
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center">
                                    <User className="w-5 h-5 mr-2" />
                                    Profile Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Display Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="handle" className="text-slate-300">
                                        Display Name
                                    </Label>
                                    <Input
                                        id="handle"
                                        value={handle}
                                        onChange={(e) => setHandle(e.target.value)}
                                        className="bg-slate-900/50 border-slate-600 text-white"
                                    />
                                </div>

                                {/* LeetCode Username */}
                                <div className="space-y-2">
                                    <Label htmlFor="leetcode" className="text-slate-300">
                                        LeetCode Username
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="leetcode"
                                            value={leetcodeUsername}
                                            onChange={(e) => setLeetcodeUsername(e.target.value)}
                                            className="bg-slate-900/50 border-slate-600 text-white pr-10"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {verifying && (
                                                <Loader className="w-4 h-4 text-blue-400 animate-spin" />
                                            )}
                                            {!verifying && isValidUsername === true && (
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                            )}
                                            {!verifying && isValidUsername === false && (
                                                <AlertCircle className="w-4 h-4 text-red-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <Button
                                    onClick={updateProfile}
                                    disabled={saving || !isValidUsername}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                >
                                    {saving ? (
                                        <>
                                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* LeetCode Stats */}
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm mt-6">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center">
                                    <Code className="w-5 h-5 mr-2" />
                                    LeetCode Statistics
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Initial Stats */}
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-300 mb-3">
                                            Initial Stats (When Joined)
                                        </h4>
                                        <div className="grid grid-cols-4 gap-2 text-center">
                                            <div>
                                                <p className="text-lg font-bold text-white">{profile.initialStats?.total || 0}</p>
                                                <p className="text-xs text-slate-400">Total</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-green-400">{profile.initialStats?.easy || 0}</p>
                                                <p className="text-xs text-slate-400">Easy</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-yellow-400">{profile.initialStats?.medium || 0}</p>
                                                <p className="text-xs text-slate-400">Medium</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-red-400">{profile.initialStats?.hard || 0}</p>
                                                <p className="text-xs text-slate-400">Hard</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Current Stats */}
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-300 mb-3">
                                            Current Stats
                                        </h4>
                                        <div className="grid grid-cols-4 gap-2 text-center">
                                            <div>
                                                <p className="text-lg font-bold text-white">{profile.currentStats?.total || 0}</p>
                                                <p className="text-xs text-slate-400">Total</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-green-400">{profile.currentStats?.easy || 0}</p>
                                                <p className="text-xs text-slate-400">Easy</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-yellow-400">{profile.currentStats?.medium || 0}</p>
                                                <p className="text-xs text-slate-400">Medium</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-red-400">{profile.currentStats?.hard || 0}</p>
                                                <p className="text-xs text-slate-400">Hard</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Since Joining */}
                                <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
                                    <h4 className="text-sm font-medium text-purple-300 mb-3">
                                        Progress Since Joining LeetFriends
                                    </h4>
                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        <div>
                                            <p className="text-2xl font-bold text-white">
                                                +{Math.max(0, (profile.currentStats?.total || 0) - (profile.initialStats?.total || 0))}
                                            </p>
                                            <p className="text-xs text-slate-400">Total</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-green-400">
                                                +{Math.max(0, (profile.currentStats?.easy || 0) - (profile.initialStats?.easy || 0))}
                                            </p>
                                            <p className="text-xs text-slate-400">Easy</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-yellow-400">
                                                +{Math.max(0, (profile.currentStats?.medium || 0) - (profile.initialStats?.medium || 0))}
                                            </p>
                                            <p className="text-xs text-slate-400">Medium</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-red-400">
                                                +{Math.max(0, (profile.currentStats?.hard || 0) - (profile.initialStats?.hard || 0))}
                                            </p>
                                            <p className="text-xs text-slate-400">Hard</p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={updateCurrentStats}
                                    disabled={updatingStats}
                                    className="w-full mt-4 border-green-600 bg-green-600/10 hover:bg-green-600/20 text-green-400"
                                    variant="outline"
                                >
                                    {updatingStats ? (
                                        <>
                                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                                            Updating Stats...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Update Current Stats
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Account Info & Danger Zone */}
                    <div className="space-y-6">
                        {/* Account Info */}
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center">
                                    <Shield className="w-5 h-5 mr-2" />
                                    Account Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-slate-400">Joined</p>
                                    <p className="text-white">
                                        {new Date(profile.onboardedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Parties</p>
                                    <p className="text-white">{profile.joinedParties?.length || 0} parties</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Email</p>
                                    <p className="text-white text-sm truncate">{profile.displayName}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Danger Zone */}
                        <Card className="bg-red-500/5 border-red-500/20 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-red-400 flex items-center">
                                    <AlertCircle className="w-5 h-5 mr-2" />
                                    Danger Zone
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-400 mb-4">
                                    Once you delete your account, there is no going back. 
                                    Please be certain.
                                </p>
                                <Button
                                    onClick={deleteAccount}
                                    variant="destructive"
                                    className="w-full bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-400"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Account
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}