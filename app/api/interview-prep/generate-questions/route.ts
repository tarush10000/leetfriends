// app/api/interview-prep/generate-questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { numberOfQuestions, topics, randomSeed, timestamp, sessionId } = await req.json();

        if (!numberOfQuestions || !topics || topics.length === 0) {
            return NextResponse.json({
                error: "Missing required fields"
            }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const topicNames = topics.map((topic: string) => {
            switch (topic) {
                case 'oop': return 'Object-Oriented Programming';
                case 'os': return 'Operating Systems';
                case 'dbms': return 'Database Management Systems';
                case 'networks': return 'Computer Networks';
                default: return topic;
            }
        });

        // Enhanced prompt with randomization and variety
        const prompt = `Generate ${numberOfQuestions} unique and varied interview questions for the following topics: ${topicNames.join(', ')}.

IMPORTANT: Create completely different questions each time. Use this randomization context:
- Session ID: ${sessionId}
- Random Seed: ${randomSeed}
- Timestamp: ${timestamp}

Requirements:
1. Generate UNIQUE questions - avoid common/repetitive questions
2. Mix different question types: theoretical, practical, scenario-based, problem-solving
3. Vary difficulty levels appropriately
4. Include modern/current practices and technologies
5. Make questions interview-realistic and engaging

For each question, provide:
1. A unique, well-crafted question that tests deep understanding
2. 3-5 key points that a strong answer should cover
3. Appropriate difficulty level (Easy, Medium, Hard)
4. The primary topic it belongs to

Question variety examples:
- Design/architecture questions
- Troubleshooting scenarios  
- Best practices and trade-offs
- Real-world application problems
- Comparison and analysis questions
- Implementation challenges

Ensure questions are:
- Professionally relevant and current
- Thought-provoking and substantive
- Varied in approach and style
- Suitable for ${new Date().getFullYear()} technology landscape

Return EXACTLY this JSON format:
{
  "questions": [
    {
      "id": "unique_id_${randomSeed}_1",
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

        // Ensure each question has a unique ID
        if (questionsData.questions) {
            questionsData.questions = questionsData.questions.map((q: any, index: number) => ({
                ...q,
                id: `${sessionId}_${randomSeed}_${index}_${timestamp}`
            }));
        }

        return NextResponse.json(questionsData);

    } catch (error) {
        console.error("Generate questions error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}