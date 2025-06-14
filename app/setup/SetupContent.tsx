"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, ArrowRight, User, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function SetupContent() {
    const [handle, setHandle] = useState("");
    const [leetcodeUsername, setLeetcodeUsername] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session } = useSession();

    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

    useEffect(() => {
        if (session?.user?.name) {
            setDisplayName(session.user.name);
        }
    }, [session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!handle.trim() || !leetcodeUsername.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/user/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    handle: handle.trim(),
                    leetcodeUsername: leetcodeUsername.trim(),
                    displayName: displayName.trim() || handle.trim(),
                }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Profile setup complete!");
                router.push(callbackUrl);
            } else {
                toast.error(data.error || "Setup failed");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-400">Please sign in to continue</p>
                    <Link href="/login">
                        <Button className="mt-4">Sign In</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 text-white">
            {/* Navigation */}
            <nav className="relative z-10 p-6">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center space-x-2">
                        <Code2 className="w-8 h-8 text-purple-400" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                            LeetFriends
                        </span>
                    </Link>
                </div>
            </nav>

            {/* Setup Content */}
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 relative">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 max-w-md mx-auto w-full">
                    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
                                <User className="w-6 h-6 mr-2 text-purple-400" />
                                Complete Your Profile
                            </CardTitle>
                            <p className="text-slate-400">
                                Set up your coding profile to get started
                            </p>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <Label htmlFor="handle" className="text-slate-300">
                                        Handle *
                                    </Label>
                                    <Input
                                        id="handle"
                                        type="text"
                                        value={handle}
                                        onChange={(e) => setHandle(e.target.value)}
                                        placeholder="Your unique handle"
                                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                                        required
                                    />
                                    <p className="text-xs text-slate-400 mt-1">
                                        This will be your unique identifier
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="leetcode" className="text-slate-300">
                                        LeetCode Username *
                                    </Label>
                                    <Input
                                        id="leetcode"
                                        type="text"
                                        value={leetcodeUsername}
                                        onChange={(e) => setLeetcodeUsername(e.target.value)}
                                        placeholder="Your LeetCode username"
                                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                                        required
                                    />
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-xs text-slate-400">
                                            We'll track your LeetCode progress
                                        </p>
                                        <Link
                                            href="https://leetcode.com"
                                            target="_blank"
                                            className="text-xs text-purple-400 hover:text-purple-300 flex items-center"
                                        >
                                            <ExternalLink className="w-3 h-3 mr-1" />
                                            LeetCode
                                        </Link>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="displayName" className="text-slate-300">
                                        Display Name
                                    </Label>
                                    <Input
                                        id="displayName"
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="How others will see you"
                                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">
                                        Optional - defaults to your handle
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading || !handle.trim() || !leetcodeUsername.trim()}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Setting up...
                                        </>
                                    ) : (
                                        <>
                                            Complete Setup
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="mt-6 text-center text-sm text-slate-400">
                        <p>Ready to compete with friends and track your progress!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}