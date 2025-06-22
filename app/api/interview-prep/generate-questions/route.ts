// app/api/interview-prep/generate-questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface QuestionRequest {
    numberOfQuestions: number;
    topics: string[];
}

const TOPIC_MAPPINGS: Record<string, string> = {
    'oop': 'Object-Oriented Programming',
    'os': 'Operating Systems',
    'dbms': 'Database Management Systems',
    'networks': 'Computer Networks'
};

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: QuestionRequest = await req.json();
        const { numberOfQuestions, topics } = body;

        if (!numberOfQuestions || !topics || topics.length === 0) {
            return NextResponse.json({
                error: "Invalid request parameters"
            }, { status: 400 });
        }

        // Map topic IDs to full names
        const topicNames = topics.map(t => TOPIC_MAPPINGS[t] || t);

        // Generate questions using Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are an expert technical interviewer for top tech companies. Generate ${numberOfQuestions} interview questions for the following topics: ${topicNames.join(', ')}.

For each question, provide:
1. A clear, concise question that would be asked in a real technical interview
2. The expected key points that a good answer should cover (3-5 points)
3. The difficulty level (Easy, Medium, or Hard)
4. The primary topic it belongs to

Ensure questions are:
- Practical and relevant to real-world scenarios
- Progressively challenging
- Testing both theoretical knowledge and practical application
- Similar to what companies like Google, Meta, Amazon ask

Return the response in this EXACT JSON format:
{
  "questions": [
    {
      "id": "unique_id",
      "question": "The interview question",
      "topic": "topic_id (oop, os, dbms, or networks)",
      "difficulty": "Easy|Medium|Hard",
      "expectedPoints": [
        "Key point 1",
        "Key point 2",
        "Key point 3"
      ]
    }
  ]
}`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse the JSON response
        let questionsData;
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                questionsData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON found in response");
            }
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", parseError);
            return NextResponse.json({
                error: "Failed to generate questions"
            }, { status: 500 });
        }

        return NextResponse.json(questionsData);

    } catch (error) {
        console.error("Generate questions error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}