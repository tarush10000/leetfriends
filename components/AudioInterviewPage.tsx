// components/AudioInterviewPage.tsx
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { User } from "next-auth";
import InterviewPrep2 from "@/components/InterviewPrep2";

interface UserProfile {
    handle: string;
    leetcodeUsername: string;
    displayName: string;
    initialStats: { easy: number; medium: number; hard: number; total: number };
    currentStats: { easy: number; medium: number; hard: number; total: number };
    onboarded: boolean;
}

interface AudioInterviewPageProps {
    user: User;
    userProfile: UserProfile;
}

export default function AudioInterviewPage({ user, userProfile }: AudioInterviewPageProps) {
    const router = useRouter();

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
                                className="text-slate-400 hover:text-white hover:bg-slate-800/50"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Button>
                            <div className="h-6 w-px bg-slate-700 hidden sm:block" />
                            <h1 className="text-lg sm:text-xl font-semibold text-white">
                                Audio Interview Practice
                            </h1>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push("/dashboard")}
                                className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                        Practice Interview Questions
                    </h2>
                    <p className="text-slate-400 text-sm lg:text-base">
                        Simulate real interview scenarios with audio-based questions and practice your responses
                    </p>
                </div>

                {/* Interview Component - Full Width */}
                <div className="w-full">
                    <InterviewPrep2 />
                </div>
            </div>
        </div>
    );
}