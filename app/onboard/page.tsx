import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import UserOnboarding from "@/components/UserOnboarding";

export default async function OnboardPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    // Check if user is already onboarded
    const db = await connectToDatabase();
    const users = db.collection("users");
    const user = await users.findOne({ email: session.user?.email });

    // If already onboarded, redirect to dashboard
    if (user?.onboarded) {
        redirect("/dashboard");
    }

    return <UserOnboarding />;
}