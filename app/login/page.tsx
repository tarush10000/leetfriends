"use client";
import { signIn, getProviders } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, Github, ArrowLeft, Code2, Shield, Users, Zap } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [providers, setProviders] = useState<any>(null);
    const [loading, setLoading] = useState<string | null>(null);
    
    const provider = searchParams.get("provider");
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

    useEffect(() => {
        const loadProviders = async () => {
            const res = await getProviders();
            setProviders(res);
        };
        loadProviders();
    }, []);

    const handleSignIn = async (providerId: string) => {
        setLoading(providerId);
        try {
            await signIn(providerId, { callbackUrl });
        } catch (error) {
            console.error("Sign in error:", error);
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex flex-col">
            {/* Navigation */}
            <nav className="p-6">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center space-x-2">
                        <Code2 className="w-8 h-8 text-purple-400" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                            LeetFriends
                        </span>
                    </Link>
                    
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-4">
                <div className="w-full max-w-md">
                    {/* Background Effects */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl"></div>
                    </div>

                    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm relative">
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-2xl font-bold text-white mb-2">
                                Welcome to LeetFriends
                            </CardTitle>
                            <p className="text-slate-400">
                                Sign in to start your competitive coding journey with friends
                            </p>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                            {/* Sign In Buttons */}
                            <div className="space-y-3">
                                <Button
                                    onClick={() => handleSignIn("google")}
                                    disabled={loading === "google"}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-12 text-base"
                                >
                                    {loading === "google" ? (
                                        <div className="flex items-center">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Signing in...
                                        </div>
                                    ) : (
                                        <>
                                            <LogIn className="w-5 h-5 mr-2" />
                                            Continue with Google
                                        </>
                                    )}
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => handleSignIn("github")}
                                    disabled={loading === "github"}
                                    className="w-full border-slate-600 bg-slate-900/50 hover:bg-slate-700/50 text-slate-300 h-12 text-base"
                                >
                                    {loading === "github" ? (
                                        <div className="flex items-center">
                                            <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin mr-2" />
                                            Signing in...
                                        </div>
                                    ) : (
                                        <>
                                            <Github className="w-5 h-5 mr-2" />
                                            Continue with GitHub
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-slate-800 px-2 text-slate-400">Why LeetFriends?</span>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="space-y-3">
                                <div className="flex items-center text-slate-300 text-sm">
                                    <Shield className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                                    <span>Secure authentication with OAuth providers</span>
                                </div>
                                <div className="flex items-center text-slate-300 text-sm">
                                    <Users className="w-4 h-4 text-blue-400 mr-3 flex-shrink-0" />
                                    <span>Create and join coding parties with friends</span>
                                </div>
                                <div className="flex items-center text-slate-300 text-sm">
                                    <Zap className="w-4 h-4 text-purple-400 mr-3 flex-shrink-0" />
                                    <span>Real-time LeetCode progress tracking</span>
                                </div>
                            </div>

                            {/* Privacy Notice */}
                            <div className="pt-4 text-center">
                                <p className="text-xs text-slate-500">
                                    By signing in, you agree to our terms of service and privacy policy.
                                    We only access your basic profile information.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Info */}
                    <div className="mt-6 text-center">
                        <p className="text-slate-400 text-sm">
                            New to LeetFriends?{" "}
                            <Link href="/" className="text-purple-400 hover:text-purple-300 transition-colors">
                                Learn more about the platform
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="p-6 text-center">
                <p className="text-slate-500 text-sm">
                    Making competitive programming more social, one friend at a time.
                </p>
            </footer>
        </div>
    );
}