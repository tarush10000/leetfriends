import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import PartyJoinForm from "@/components/PartyJoinForm";

export default async function JoinPartyPage() {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        redirect("/login");
    }

    const db = await connectToDatabase();
    const users = db.collection("users");
    const user = await users.findOne({ email: session.user?.email });

    if (!user?.onboarded) {
        redirect("/onboard");
    }

    const userProfile = {
        handle: user.handle || "",
        leetcodeUsername: user.leetcodeUsername || "",
        displayName: user.displayName || user.handle || "",
        initialStats: user.initialStats || { easy: 0, medium: 0, hard: 0, total: 0 },
        currentStats: user.currentStats || { easy: 0, medium: 0, hard: 0, total: 0 }
    };

    return <PartyJoinForm userProfile={userProfile} />;
}
