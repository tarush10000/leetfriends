// app/interview-prep/page.tsx - Protected with Gold membership check
import InterviewPrep from "@/components/InterviewPrep";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { canUserAccessFeature } from "@/lib/subscription";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function InterviewPrepPage() {
    const session = await getServerSession(authOptions);
    
    // If not authenticated, redirect to login
    if (!session) {
        redirect("/login");
    }

    const db = await connectToDatabase();
    const users = db.collection("users");
    const user = await users.findOne({ email: session.user?.email });

    // If user doesn't exist or is not onboarded, redirect accordingly
    if (!user) {
        redirect("/onboard");
    }

    if (!user.onboarded) {
        redirect("/onboard");
    }

    // Check subscription tier
    const userTier = user.subscription?.tier || 'free';
    const hasInterviewAccess = canUserAccessFeature(userTier, 'interview-prep');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
            <SubscriptionGuard
                userTier={userTier}
                requiredTier="gold"
                feature="Advanced Interview Preparation"
                featureDescription="Access our comprehensive interview preparation system with AI-powered questions, real-time feedback, and performance analytics designed to ace your technical interviews."
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="mb-6">
                        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                            Interview Preparation
                        </h2>
                        <p className="text-slate-400 text-sm lg:text-base">
                            Practice with AI-generated questions and get real-time feedback
                        </p>
                    </div>
                    <InterviewPrep userEmail={user.email} />
                </div>
            </SubscriptionGuard>
        </div>
    );
}