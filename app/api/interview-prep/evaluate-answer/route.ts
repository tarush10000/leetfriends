// app/api/interview-prep/evaluate-answer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface EvaluationRequest {
    question: {
        question: string;
        expectedPoints: string[];
        topic: string;
        difficulty: string;
    };
    answer: string;
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: EvaluationRequest = await req.json();
        const { question, answer } = body;

        if (!question || !answer) {
            return NextResponse.json({ 
                error: "Invalid request parameters" 
            }, { status: 400 });
        }

        // Evaluate the answer using Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are an expert technical interviewer evaluating a candidate's answer. 

Question: ${question.question}
Expected Key Points: ${question.expectedPoints.join(', ')}
Topic: ${question.topic}
Difficulty: ${question.difficulty}

Candidate's Answer: ${answer}

Evaluate the answer based on:
1. Coverage of expected key points
2. Technical accuracy
3. Clarity and structure
4. Depth of understanding
5. Practical examples or applications mentioned

Provide a score from 0-100 and 3-4 specific, actionable feedback points for improvement.

Return the response in this EXACT JSON format:
{
  "score": 85,
  "feedback": [
    "Specific improvement suggestion 1",
    "Specific improvement suggestion 2",
    "Specific improvement suggestion 3"
  ],
  "strengths": [
    "What the candidate did well"
  ],
  "missedPoints": [
    "Key points that were not covered"
  ]
}`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse the JSON response
        let evaluationData;
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                evaluationData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON found in response");
            }
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", parseError);
            return NextResponse.json({ 
                error: "Failed to evaluate answer" 
            }, { status: 500 });
        }

        return NextResponse.json(evaluationData);

    } catch (error) {
        console.error("Evaluate answer error:", error);
        return NextResponse.json({ 
            error: "Internal server error" 
        }, { status: 500 });
    }
}