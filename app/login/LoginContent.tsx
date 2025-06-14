"use client";
import { useSearchParams } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Code2, Users, Trophy, Zap } from "lucide-react";
import Link from "next/link";

export default function LoginContent() {
    const [providers, setProviders] = useState<any>(null);
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

    useEffect(() => {
        const setUpProviders = async () => {
            const response = await getProviders();
            setProviders(response);
        };
        setUpProviders();
    }, []);

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

            {/* Login Content */}
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 relative">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 max-w-md mx-auto">
                    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold text-white mb-2">
                                Welcome Back
                            </CardTitle>
                            <p className="text-slate-400">
                                Sign in to continue your coding journey
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {providers && Object.values(providers).map((provider: any) => (
                                <Button
                                    key={provider.name}
                                    onClick={() => signIn(provider.id, { callbackUrl })}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3"
                                >
                                    {provider.name === 'GitHub' && <Github className="w-5 h-5 mr-2" />}
                                    Sign in with {provider.name}
                                </Button>
                            ))}

                            {!providers && (
                                <div className="text-center py-4">
                                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <p className="text-slate-400 text-sm">Loading providers...</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Features Preview */}
                    <div className="mt-8 text-center">
                        <p className="text-slate-400 mb-4">Join thousands of developers</p>
                        <div className="flex justify-center space-x-6 text-sm">
                            <div className="flex items-center text-slate-300">
                                <Users className="w-4 h-4 mr-1 text-purple-400" />
                                Compete
                            </div>
                            <div className="flex items-center text-slate-300">
                                <Trophy className="w-4 h-4 mr-1 text-yellow-400" />
                                Track
                            </div>
                            <div className="flex items-center text-slate-300">
                                <Zap className="w-4 h-4 mr-1 text-green-400" />
                                Improve
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}