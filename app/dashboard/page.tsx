// app/dashboard/page.tsx - Enhanced with proper auth flow
import Dashboard from "@/components/Dashboard";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    
    // If not authenticated, redirect to login
    if (!session) {
        redirect("/login");
    }

    const db = await connectToDatabase();
    const users = db.collection("users");
    const user = await users.findOne({ email: session.user?.email });

    // If user doesn't exist in database, create basic record and redirect to onboarding
    if (!user) {
        await users.insertOne({
            email: session.user?.email,
            name: session.user?.name,
            image: session.user?.image,
            createdAt: new Date(),
            onboarded: false,
        });
        redirect("/onboard");
    }

    // If user exists but is not onboarded, redirect to onboarding
    if (!user.onboarded) {
        redirect("/onboard");
    }

    // Transform MongoDB document to expected interface
    const userProfile = {
        handle: user.handle || "",
        leetcodeUsername: user.leetcodeUsername || "",
        displayName: user.displayName || user.handle || "",
        initialStats: user.initialStats || { easy: 0, medium: 0, hard: 0, total: 0 },
        currentStats: user.currentStats || { easy: 0, medium: 0, hard: 0, total: 0 },
        onboarded: user.onboarded || false
    };

    return <Dashboard user={session.user} userProfile={userProfile} />;
}