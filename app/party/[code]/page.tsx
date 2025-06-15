// app/party/[code]/page.tsx - Enhanced with proper access control
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import PartyPage from "@/components/PartyPage";
import PartyJoinPrompt from "@/components/PartyJoinPrompt";

interface Props {
    params: Promise<{
        code: string;
    }>;
}

export default async function PartyRoute({ params }: Props) {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    // Await params in Next.js 15+
    const { code } = await params;

    const db = await connectToDatabase();
    const users = db.collection("users");
    const parties = db.collection("parties");

    // Check if user is onboarded
    const user = await users.findOne({ email: session.user?.email });
    if (!user?.onboarded) {
        redirect("/onboard");
    }

    // Check if party exists
    const party = await parties.findOne({ code: code.toUpperCase() });
    if (!party) {
        redirect("/dashboard?error=party-not-found");
    }

    // Check if user is a member of the party
    const isMember = party.members.find((m: any) => m.email === session.user?.email);
    
    if (!isMember) {
        // User is not a member, show join prompt
        const partyInfo = {
            code: party.code,
            name: party.name,
            memberCount: party.members.length,
            maxMembers: party.maxMembers,
            hasPassword: !!party.password,
            createdAt: party.createdAt
        };

        const userProfile = {
            handle: user.handle || "",
            leetcodeUsername: user.leetcodeUsername || "",
            displayName: user.displayName || user.handle || "",
            initialStats: user.initialStats || { easy: 0, medium: 0, hard: 0, total: 0 },
            currentStats: user.currentStats || { easy: 0, medium: 0, hard: 0, total: 0 }
        };

        return <PartyJoinPrompt partyInfo={partyInfo} userProfile={userProfile} />;
    }

    // User is a member, show the party page
    return <PartyPage code={code} />;
}