import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import SettingsPage from "@/components/SettingsPage";

export default async function Settings() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    // Check if user is onboarded
    const db = await connectToDatabase();
    const users = db.collection("users");
    const user = await users.findOne({ email: session.user?.email });

    if (!user?.onboarded) {
        redirect("/onboard");
    }

    // Transform MongoDB document to expected interface
    const userProfile = {
        handle: user.handle || "",
        leetcodeUsername: user.leetcodeUsername || "",
        displayName: user.displayName || user.handle || "",
        initialStats: user.initialStats || { easy: 0, medium: 0, hard: 0, total: 0 },
        currentStats: user.currentStats || { easy: 0, medium: 0, hard: 0, total: 0 },
        onboardedAt: user.onboardedAt || new Date().toISOString(),
        joinedParties: user.joinedParties || []
    };

    return <SettingsPage initialProfile={userProfile} />;
}