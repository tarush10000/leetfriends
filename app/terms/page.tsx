import { Metadata } from 'next';
import Link from 'next/link';
import { Code2, FileText, ArrowLeft, Scale, AlertTriangle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
    title: 'Terms & Conditions - LeetFriends',
    description: 'Terms and conditions for using the LeetFriends platform',
};

export default function TermsPage() {
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
                            <FileText className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                            Terms & <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">Conditions</span>
                        </h1>
                        <p className="text-xl text-slate-400">
                            Please read these terms carefully before using our platform.
                        </p>
                        <p className="text-sm text-slate-500 mt-4">Last updated: June 16, 2025</p>
                    </div>

                    <div className="space-y-8">
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <div className="flex items-center mb-6">
                                    <Scale className="w-8 h-8 text-purple-400 mr-3" />
                                    <h2 className="text-2xl font-bold text-white">Acceptance of Terms</h2>
                                </div>
                                <div className="text-slate-300 space-y-4">
                                    <p>
                                        By accessing and using LeetFriends ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.
                                    </p>
                                    <p>
                                        These terms apply to all users of the Platform, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Use License</h2>
                                <div className="text-slate-300 space-y-4">
                                    <p>
                                        Permission is granted to temporarily access LeetFriends for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                                    </p>
                                    <ul className="space-y-2 ml-4">
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Modify or copy the materials
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Use the materials for commercial purposes or public display
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Attempt to reverse engineer any software contained on the Platform
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Remove any copyright or proprietary notations from the materials
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <div className="flex items-center mb-6">
                                    <Users className="w-8 h-8 text-pink-400 mr-3" />
                                    <h2 className="text-2xl font-bold text-white">User Accounts</h2>
                                </div>
                                <div className="text-slate-300 space-y-4">
                                    <p>
                                        To access certain features of the Platform, you may be required to create an account. You are responsible for:
                                    </p>
                                    <ul className="space-y-2 ml-4">
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Maintaining the confidentiality of your account credentials
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            All activities that occur under your account
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Providing accurate and current information
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Notifying us immediately of unauthorized use
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Payment Terms</h2>
                                <div className="text-slate-300 space-y-4">
                                    <p>
                                        For paid subscription plans, the following terms apply:
                                    </p>
                                    <ul className="space-y-2 ml-4">
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            All fees are charged in Indian Rupees (INR)
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Subscription fees are billed in advance on a monthly or yearly basis
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Fees are non-refundable except as expressly stated in our refund policy
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            We reserve the right to change fees with 30 days advance notice
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Prohibited Uses</h2>
                                <div className="text-slate-300 space-y-4">
                                    <p>
                                        You may not use our Platform:
                                    </p>
                                    <ul className="space-y-2 ml-4">
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            For any unlawful purpose or to solicit others to perform illegal acts
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            To transmit or procure the sending of any advertising or promotional material
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            To impersonate or attempt to impersonate other users or entities
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <div className="flex items-center mb-6">
                                    <AlertTriangle className="w-8 h-8 text-yellow-500 mr-3" />
                                    <h2 className="text-2xl font-bold text-white">Disclaimer</h2>
                                </div>
                                <div className="text-slate-300 space-y-4">
                                    <p>
                                        The materials on LeetFriends are provided on an 'as is' basis. LeetFriends makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                                    </p>
                                    <p>
                                        Further, LeetFriends does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
