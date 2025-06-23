"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Code, Loader, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface LeetCodeStats {
    easy: number;
    medium: number;
    hard: number;
    total: number;
}

export default function UserOnboarding() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    
    // User data
    const [handle, setHandle] = useState("");
    const [leetcodeUsername, setLeetcodeUsername] = useState("");
    const [leetcodeStats, setLeetcodeStats] = useState<LeetCodeStats | null>(null);
    const [isValidUsername, setIsValidUsername] = useState<boolean | null>(null);

    // Verify LeetCode username
    const verifyLeetCodeUsername = async (username: string) => {
        if (!username.trim()) {
            setIsValidUsername(null);
            setLeetcodeStats(null);
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
                setLeetcodeStats(data.stats);
                toast.success("LeetCode profile verified!");
            } else {
                setIsValidUsername(false);
                setLeetcodeStats(null);
                toast.error("LeetCode username not found");
            }
        } catch (error) {
            setIsValidUsername(false);
            setLeetcodeStats(null);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValidUsername || !leetcodeStats) {
            toast.error("Please verify your LeetCode username first");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/user/onboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    handle: handle.trim(),
                    leetcodeUsername: leetcodeUsername.trim(),
                    initialStats: leetcodeStats,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Profile setup complete!");
                router.push("/dashboard");
            } else {
                toast.error(data.error || "Failed to setup profile");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold text-white mb-2">
                            Welcome to LeetFriends!
                        </CardTitle>
                        <p className="text-slate-400">
                            Let's set up your profile to get started
                        </p>
                    </CardHeader>
                    
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Display Name */}
                            <div className="space-y-2">
                                <Label htmlFor="handle" className="text-slate-300 flex items-center">
                                    <User className="w-4 h-4 mr-2" />
                                    Display Name
                                </Label>
                                <Input
                                    id="handle"
                                    value={handle}
                                    onChange={(e) => setHandle(e.target.value)}
                                    placeholder="How should we call you?"
                                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                                    required
                                />
                                <p className="text-xs text-slate-500">
                                    This will be shown to other party members
                                </p>
                            </div>

                            {/* LeetCode Username */}
                            <div className="space-y-2">
                                <Label htmlFor="leetcode" className="text-slate-300 flex items-center">
                                    <Code className="w-4 h-4 mr-2" />
                                    LeetCode Username
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="leetcode"
                                        value={leetcodeUsername}
                                        onChange={(e) => setLeetcodeUsername(e.target.value)}
                                        placeholder="Your LeetCode username"
                                        className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                                        required
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
                                <p className="text-xs text-slate-500">
                                    We'll verify this exists on LeetCode
                                </p>
                            </div>

                            {/* Stats Preview */}
                            {leetcodeStats && isValidUsername && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                                >
                                    <div className="flex items-center text-green-400 text-sm mb-2">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        LeetCode Profile Verified!
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        <div>
                                            <p className="text-lg font-bold text-white">{leetcodeStats.total}</p>
                                            <p className="text-xs text-slate-400">Total</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-green-400">{leetcodeStats.easy}</p>
                                            <p className="text-xs text-slate-400">Easy</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-yellow-400">{leetcodeStats.medium}</p>
                                            <p className="text-xs text-slate-400">Medium</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-red-400">{leetcodeStats.hard}</p>
                                            <p className="text-xs text-slate-400">Hard</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={loading || !isValidUsername || !handle.trim()}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-12"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                                        Setting up profile...
                                    </div>
                                ) : (
                                    "Complete Setup"
                                )}
                            </Button>

                            <div className="text-center pt-4">
                                <p className="text-slate-400 text-sm">
                                    Your LeetCode stats will be used to track progress in parties
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}