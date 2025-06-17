// /api/ai-recommendations/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = await connectToDatabase();
        const users = db.collection("users");

        // Get user's current profile and stats
        const user = await users.findOne({ email: session.user.email });
        if (!user || !user.onboarded) {
            return NextResponse.json({ error: "User profile not found" }, { status: 404 });
        }

        const userProfile = {
            handle: user.handle,
            leetcodeUsername: user.leetcodeUsername,
            displayName: user.displayName || user.name,
            onboarded: user.onboarded
        };

        const leetcodeStats = user.currentStats || {
            easy: 0,
            medium: 0,
            hard: 0,
            total: 0
        };

        // Call the AI recommendations API internally
        const recommendationsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai-recommendations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': req.headers.get('cookie') || '',
            },
            body: JSON.stringify({
                userProfile,
                leetcodeStats
            })
        });

        if (!recommendationsResponse.ok) {
            throw new Error(`Recommendations API failed: ${recommendationsResponse.status}`);
        }

        const recommendationsData = await recommendationsResponse.json();

        // Cache the recommendations in user document
        await users.updateOne(
            { email: session.user.email },
            {
                $set: {
                    cachedRecommendations: {
                        ...recommendationsData,
                        cachedAt: new Date().toISOString()
                    },
                    lastRecommendationsUpdate: new Date()
                }
            }
        );

        return NextResponse.json({
            success: true,
            message: "AI recommendations refreshed successfully",
            data: recommendationsData,
            refreshedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error refreshing AI recommendations:", error);
        return NextResponse.json({
            error: "Failed to refresh recommendations",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}