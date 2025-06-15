// app/interview-prep/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import InterviewPrep from "@/components/InterviewPrep";

export default async function InterviewPrepPage() {
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

    if (!session.user?.email) {
        throw new Error("User email is missing from session.");
    }
    return <InterviewPrep userEmail={session.user.email} />;
}