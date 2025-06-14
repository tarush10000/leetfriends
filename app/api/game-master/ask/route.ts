import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { partyCode, userQuery } = await req.json();

        if (!partyCode || !userQuery) {
            return NextResponse.json({
                error: "Party code and query are required"
            }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({
                error: "AI service is not configured"
            }, { status: 503 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are an AI coding assistant and mentor for a competitive programming party. 
    A user from party "${partyCode}" is asking: "${userQuery}"

    Please provide helpful, encouraging advice about:
    - Algorithm strategies and approaches
    - Debugging tips
    - Code optimization techniques
    - Problem-solving patterns
    - Time/space complexity analysis
    - General programming concepts

    Keep your response concise (under 200 words), practical, and encouraging. 
    Don't solve problems completely - guide them toward the solution.
    Use a friendly, supportive tone that motivates continued learning.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        return NextResponse.json({
            success: true,
            response: response.trim(),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Game Master ask error:", error);

        // Handle specific Gemini API errors
        if (error instanceof Error) {
            if (error.message.includes('API_KEY')) {
                return NextResponse.json({
                    error: "AI service configuration error"
                }, { status: 503 });
            }
            if (error.message.includes('quota') || error.message.includes('limit')) {
                return NextResponse.json({
                    error: "AI service is temporarily unavailable due to high usage"
                }, { status: 503 });
            }
        }

        return NextResponse.json({
            error: "Game Master is currently unavailable"
        }, { status: 500 });
    }
}