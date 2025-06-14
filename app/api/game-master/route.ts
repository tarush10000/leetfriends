import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Get a random unsolved problem for party members
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { action, partyCode, difficulty, topic, userQuery, timerMinutes } = await req.json();

        const db = await connectToDatabase();
        const parties = db.collection("parties");
        const challenges = db.collection("challenges");

        // Verify user is party owner
        const party = await parties.findOne({ 
            code: partyCode, 
            "members.email": session.user?.email,
            "members.isOwner": true 
        });

        if (!party) {
            return NextResponse.json({ error: "Only party owners can use Game Master" }, { status: 403 });
        }

        if (action === "suggest_problem") {
            return await suggestProblem(party, difficulty, topic, timerMinutes, challenges);
        } else if (action === "ask_gm") {
            return await askGameMaster(userQuery, party);
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

    } catch (error) {
        console.error("Game Master error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

async function suggestProblem(party: any, difficulty: string, topic: string, timerMinutes: number, challenges: any) {
    try {
        // Use the correct model name for Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Get member LeetCode usernames for context
        const memberUsernames = party.members.map((m: any) => m.leetcodeUsername).join(", ");
        
        const prompt = `You are a Game Master for a competitive programming party. Generate a LeetCode-style coding problem that:

1. Difficulty: ${difficulty || 'Medium'}
2. Topic: ${topic || 'Any data structure or algorithm'}
3. Should be solvable in approximately ${timerMinutes || 30} minutes
4. Should be challenging but fair for a competitive session
5. Include a clear problem statement, examples, and constraints

Party members: ${memberUsernames}

Format your response as a JSON object with:
{
  "title": "Problem Title",
  "difficulty": "${difficulty || 'Medium'}",
  "description": "Clear problem statement...",
  "examples": [
    {
      "input": "example input",
      "output": "example output", 
      "explanation": "why this output"
    }
  ],
  "constraints": ["constraint 1", "constraint 2"],
  "hints": ["hint 1", "hint 2"],
  "timeLimit": ${timerMinutes || 30},
  "topics": ["${topic || 'Array'}", "Algorithm"]
}

Make it engaging and well-structured!`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        // Try to parse JSON from response
        let problemData;
        try {
            // Extract JSON from response (in case there's extra text)
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                problemData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON found in response");
            }
        } catch (parseError) {
            // Fallback: create structured problem from text
            problemData = {
                title: `${difficulty} ${topic} Challenge`,
                difficulty: difficulty || 'Medium',
                description: response,
                examples: [],
                constraints: [],
                hints: [],
                timeLimit: timerMinutes || 30,
                topics: [topic || 'Algorithm']
            };
        }

        // Create challenge in database
        const challenge = {
            partyCode: party.code,
            problemData,
            createdBy: party.members.find((m: any) => m.isOwner)?.email,
            createdAt: new Date(),
            timerMinutes: timerMinutes || 30,
            status: 'active',
            submissions: [],
            startTime: new Date(),
            endTime: new Date(Date.now() + (timerMinutes || 30) * 60 * 1000)
        };

        const insertResult = await challenges.insertOne(challenge);

        return NextResponse.json({
            success: true,
            challenge: problemData,
            challengeId: insertResult.insertedId,
            message: "Game Master has created a new challenge!"
        });

    } catch (error) {
        console.error("Error generating problem:", error);
        return NextResponse.json({ error: "Failed to generate problem" }, { status: 500 });
    }
}

async function askGameMaster(userQuery: string, party: any) {
    try {
        // Use the correct model name for Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `You are the Game Master for the coding party "${party.name}". You help with:
- Coding questions and algorithm explanations
- Problem-solving strategies and hints
- Code review and debugging help
- Contest strategy and time management
- Motivation and encouragement

Party context:
- Party: ${party.name}
- Members: ${party.members.length}
- LeetCode usernames: ${party.members.map((m: any) => m.leetcodeUsername).join(", ")}

User question: "${userQuery}"

Provide a helpful, encouraging response as a Game Master. Be concise but thorough. If it's a coding problem, provide hints rather than full solutions to maintain the learning experience.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        return NextResponse.json({
            success: true,
            response,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error asking Game Master:", error);
        return NextResponse.json({ error: "Game Master is temporarily unavailable" }, { status: 500 });
    }
}

// Get active challenges for a party
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const partyCode = searchParams.get("partyCode");

        if (!partyCode) {
            return NextResponse.json({ error: "Party code required" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const challenges = db.collection("challenges");

        const activeChallenges = await challenges
            .find({ 
                partyCode, 
                status: 'active',
                endTime: { $gt: new Date() }
            })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({ challenges: activeChallenges });

    } catch (error) {
        console.error("Error fetching challenges:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}