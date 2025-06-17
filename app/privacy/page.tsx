import { Metadata } from 'next';
import Link from 'next/link';
import { Code2, Shield, ArrowLeft, Lock, Eye, Users, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
    title: 'Privacy Policy - LeetFriends',
    description: 'Learn how LeetFriends protects your privacy and handles your personal data',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="border-b border-slate-800/50 py-6 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <Code2 className="w-8 h-8 text-purple-400" />
                        <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                            LeetFriends
                        </span>
                    </Link>
                    <Link href="/">
                        <Button variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            <Shield className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                            Privacy <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">Policy</span>
                        </h1>
                        <p className="text-xl text-slate-400">
                            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
                        </p>
                        <p className="text-sm text-slate-500 mt-4">Last updated: June 16, 2025</p>
                    </div>

                    <div className="space-y-8">
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <div className="flex items-center mb-6">
                                    <Database className="w-8 h-8 text-purple-400 mr-3" />
                                    <h2 className="text-2xl font-bold text-white">Information We Collect</h2>
                                </div>
                                <div className="space-y-4 text-slate-300">
                                    <div>
                                        <h3 className="font-semibold text-white mb-2">Personal Information</h3>
                                        <p>We collect information you provide directly, such as your name, email address, and profile information when you create an account.</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white mb-2">Usage Data</h3>
                                        <p>We automatically collect information about your use of our platform, including coding session data, progress metrics, and feature usage.</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white mb-2">Technical Data</h3>
                                        <p>We collect device information, IP addresses, browser types, and other technical data to improve our services and ensure security.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <div className="flex items-center mb-6">
                                    <Eye className="w-8 h-8 text-pink-400 mr-3" />
                                    <h2 className="text-2xl font-bold text-white">How We Use Your Information</h2>
                                </div>
                                <div className="space-y-3 text-slate-300">
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Provide and improve our coding practice platform
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Generate AI-powered insights and recommendations
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Facilitate coding parties and collaborative sessions
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Send important updates about your account and our services
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Ensure platform security and prevent fraud
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <div className="flex items-center mb-6">
                                    <Users className="w-8 h-8 text-purple-400 mr-3" />
                                    <h2 className="text-2xl font-bold text-white">Information Sharing</h2>
                                </div>
                                <div className="space-y-4 text-slate-300">
                                    <p>We do not sell your personal information. We may share your information only in these limited circumstances:</p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            With your consent or at your direction
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            With service providers who help us operate our platform
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            To comply with legal obligations or court orders
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            To protect our rights and prevent fraud or abuse
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <div className="flex items-center mb-6">
                                    <Lock className="w-8 h-8 text-pink-400 mr-3" />
                                    <h2 className="text-2xl font-bold text-white">Data Security</h2>
                                </div>
                                <div className="space-y-4 text-slate-300">
                                    <p>We implement industry-standard security measures to protect your information:</p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Encryption of data in transit and at rest
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Regular security audits and monitoring
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Access controls and authentication mechanisms
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Secure payment processing through trusted providers
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Your Rights</h2>
                                <div className="space-y-4 text-slate-300">
                                    <p>You have the following rights regarding your personal information:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="font-semibold text-white mb-2">Access & Portability</h3>
                                            <p className="text-sm">Request copies of your personal data</p>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white mb-2">Correction</h3>
                                            <p className="text-sm">Update inaccurate information</p>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white mb-2">Deletion</h3>
                                            <p className="text-sm">Request deletion of your data</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
