// app/pricing/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import PricingPage from "@/components/PricingPage";

export default async function PricingRoute() {
    const session = await getServerSession(authOptions);
    
    let currentTier = 'free';
    let userEmail = undefined;

    if (session?.user?.email) {
        try {
            const db = await connectToDatabase();
            const users = db.collection("users");
            const user = await users.findOne({ email: session.user.email });
            
            if (user) {
                currentTier = user.subscription?.tier || 'free';
                userEmail = session.user.email;
            }
        } catch (error) {
            console.error("Error fetching user subscription:", error);
        }
    }

    return <PricingPage currentTier={currentTier} userEmail={userEmail} />;
}