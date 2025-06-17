// app/refund/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { Code2, RefreshCw, ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
    title: 'Cancellation & Refund Policy - LeetFriends',
    description: 'Learn about our cancellation and refund policy for LeetFriends subscriptions',
};

export default function RefundPage() {
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
                            <RefreshCw className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                            Cancellation & <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">Refund Policy</span>
                        </h1>
                        <p className="text-xl text-slate-400">
                            We want you to be completely satisfied with LeetFriends. Here's our fair and transparent refund policy.
                        </p>
                        <p className="text-sm text-slate-500 mt-4">Last updated: June 16, 2025</p>
                    </div>

                    <div className="space-y-8">
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <div className="flex items-center mb-6">
                                    <Clock className="w-8 h-8 text-purple-400 mr-3" />
                                    <h2 className="text-2xl font-bold text-white">7-Day Free Trial</h2>
                                </div>
                                <div className="text-slate-300 space-y-4">
                                    <p>
                                        All paid plans come with a 7-day free trial period. During this time:
                                    </p>
                                    <ul className="space-y-2 ml-4">
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            You can cancel anytime without being charged
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Full access to all premium features
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            No credit card required to start the trial
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Automatic cancellation if you don't upgrade
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <div className="flex items-center mb-6">
                                    <CheckCircle className="w-8 h-8 text-green-400 mr-3" />
                                    <h2 className="text-2xl font-bold text-white">Refund Eligibility</h2>
                                </div>
                                <div className="text-slate-300 space-y-4">
                                    <p>
                                        You may be eligible for a refund in the following situations:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-slate-700/30 p-4 rounded-lg">
                                            <h3 className="font-semibold text-white mb-2">Accidental Purchase</h3>
                                            <p className="text-sm">Unintended subscription purchase reported within 48 hours</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <div className="flex items-center mb-6">
                                    <XCircle className="w-8 h-8 text-red-400 mr-3" />
                                    <h2 className="text-2xl font-bold text-white">Non-Refundable Situations</h2>
                                </div>
                                <div className="text-slate-300 space-y-4">
                                    <p>
                                        Refunds are generally not available in these situations:
                                    </p>
                                    <ul className="space-y-2 ml-4">
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            After 30 days from initial purchase (except for technical issues)
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Account suspension due to violation of terms of service
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Change of mind after actively using the platform for weeks
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Failure to cancel before renewal (but future billing will be stopped)
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">How to Cancel Your Subscription</h2>
                                <div className="text-slate-300 space-y-4">
                                    <p>
                                        You can cancel your subscription at any time through these methods:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-slate-700/30 p-6 rounded-lg text-center">
                                            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                                                <span className="text-white font-bold">1</span>
                                            </div>
                                            <h3 className="font-semibold text-white mb-2">Dashboard</h3>
                                            <p className="text-sm">Go to Account Settings → Billing → Cancel Subscription</p>
                                        </div>
                                        <div className="bg-slate-700/30 p-6 rounded-lg text-center">
                                            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                                                <span className="text-white font-bold">2</span>
                                            </div>
                                            <h3 className="font-semibold text-white mb-2">Email</h3>
                                            <p className="text-sm">Send a cancellation request to tarushagarwal2003@gmail.com</p>
                                        </div>
                                        <div className="bg-slate-700/30 p-6 rounded-lg text-center">
                                            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                                                <span className="text-white font-bold">3</span>
                                            </div>
                                            <h3 className="font-semibold text-white mb-2">Support</h3>
                                            <p className="text-sm">Contact our support team via form or phone</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Refund Process</h2>
                                <div className="text-slate-300 space-y-4">
                                    <p>
                                        When you request a refund:
                                    </p>
                                    <div className="space-y-4">
                                        <div className="flex items-start">
                                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                                <span className="text-white text-sm font-bold">1</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white mb-1">Request Review</h3>
                                                <p className="text-sm">We'll review your refund request within 2-3 business days</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                                <span className="text-white text-sm font-bold">2</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white mb-1">Approval & Processing</h3>
                                                <p className="text-sm">If approved, refunds are processed within 5-7 business days</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                                <span className="text-white text-sm font-bold">3</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white mb-1">Credit to Original Payment Method</h3>
                                                <p className="text-sm">Refunds are credited to the original payment method used</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Prorated Refunds</h2>
                                <div className="text-slate-300 space-y-4">
                                    <p>
                                        For certain situations, we may offer prorated refunds:
                                    </p>
                                    <ul className="space-y-2 ml-4">
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Downgrading from a higher tier plan
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Platform unavailability for extended periods
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Mid-cycle cancellations in special circumstances
                                        </li>
                                    </ul>
                                    <p className="text-sm bg-slate-700/30 p-4 rounded-lg">
                                        <strong className="text-white">Note:</strong> Prorated refunds are calculated based on unused days in your billing cycle and are subject to our discretion.
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