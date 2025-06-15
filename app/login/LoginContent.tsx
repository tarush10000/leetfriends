"use client";
import { useSearchParams } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Code2, Users, Trophy, Zap } from "lucide-react";
import Link from "next/link";

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);

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

    const getProviderIcon = (providerName: string) => {
        switch (providerName.toLowerCase()) {
            case 'github':
                return <Github className="w-5 h-5 mr-2" />;
            case 'google':
                return <GoogleIcon />;
            default:
                return null;
        }
    };

    const getProviderStyles = (providerName: string) => {
        switch (providerName.toLowerCase()) {
            case 'github':
                return "w-full bg-[#24292F] hover:bg-[#1C2127] text-white font-medium py-3 border border-slate-600";
            case 'google':
                return "w-full bg-white hover:bg-gray-50 text-gray-900 font-medium py-3 border border-gray-300";
            default:
                return "w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3";
        }
    };

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
                                    className={getProviderStyles(provider.name)}
                                >
                                    {getProviderIcon(provider.name)}
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