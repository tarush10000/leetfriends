// app/interview/page.tsx - Protected with Gold membership check
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { canUserAccessFeature } from "@/lib/subscription";
import AudioInterviewPage from "@/components/AudioInterviewPage";
import SubscriptionGuard from "@/components/SubscriptionGuard";

export default async function InterviewPage() {
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

    // Transform MongoDB document to expected interface
    const userProfile = {
        handle: user.handle || "",
        leetcodeUsername: user.leetcodeUsername || "",
        displayName: user.displayName || user.handle || "",
        initialStats: user.initialStats || { easy: 0, medium: 0, hard: 0, total: 0 },
        currentStats: user.currentStats || { easy: 0, medium: 0, hard: 0, total: 0 },
        onboarded: user.onboarded || false
    };

    return (
        <SubscriptionGuard
            userTier={userTier}
            requiredTier="gold"
            feature="AI-Powered Interview Practice"
            featureDescription="Practice technical interviews with AI-generated questions, real-time evaluation, and detailed feedback to improve your interview skills."
        >
            <AudioInterviewPage
                user={{
                    id: user._id?.toString?.() ?? "",
                    name: session.user?.name,
                    email: session.user?.email,
                    image: session.user?.image
                }}
                userProfile={userProfile}
            />
        </SubscriptionGuard>
    );
}