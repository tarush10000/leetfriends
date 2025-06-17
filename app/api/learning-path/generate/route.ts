import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface LearningPathDay {
    day: number;
    topic: string;
    subtopic: string;
    problemCount: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
    estimatedTime: string;
    concepts: string[];
    problems: LeetCodeProblem[];
    goals: string[];
    resources?: string[];
}

interface LeetCodeProblem {
    title: string;
    number: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    url: string;
    topics: string[];
    pattern: string;
    estimatedTime: string;
    notes?: string;
}

interface LearningPath {
    id: string;
    userId: string;
    title: string;
    description: string;
    duration: number; // days
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    goals: string[];
    prerequisites: string[];
    days: LearningPathDay[];
    createdAt: Date;
    status: 'generated' | 'accepted' | 'in_progress' | 'completed' | 'paused';
    progress: {
        daysCompleted: number;
        problemsCompleted: number;
        totalProblems: number;
        currentDay: number;
    };
    customizations: {
        dailyProblemCount: number;
        skipTopics: string[];
        focusAreas: string[];
        timeAvailable: string; // "1-2 hours", "2-3 hours", etc.
    };
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userProfile, leetcodeStats, preferences } = await req.json();

        const db = await connectToDatabase();
        const users = db.collection("users");
        const user = await users.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Generate learning path using AI
        const learningPath = await generateLearningPath(userProfile, leetcodeStats, preferences);
        
        // Save to database as "generated" status
        const learningPaths = db.collection("learning_paths");
        const result = await learningPaths.insertOne({
            ...learningPath,
            userId: session.user.email,
            createdAt: new Date(),
            status: 'generated'
        });

        return NextResponse.json({
            success: true,
            learningPath: {
                ...learningPath,
                id: result.insertedId.toString()
            }
        });

    } catch (error) {
        console.error("Learning path generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate learning path" },
            { status: 500 }
        );
    }
}

async function generateLearningPath(userProfile: any, stats: any, preferences: any): Promise<LearningPath> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const userLevel = determineUserLevel(stats);
        const duration = preferences?.duration || calculateOptimalDuration(stats);
        const dailyProblems = preferences?.dailyProblems || 2;

        const prompt = `Create a comprehensive ${duration}-day learning path for a ${userLevel} level programmer.

User Statistics:
- Easy: ${stats.easy} problems
- Medium: ${stats.medium} problems  
- Hard: ${stats.hard} problems
- Total: ${stats.total} problems

Preferences:
- Daily time available: ${preferences?.timeAvailable || "1-2 hours"}
- Problems per day: ${dailyProblems}
- Focus areas: ${preferences?.focusAreas?.join(", ") || "Interview preparation"}
- Skip topics: ${preferences?.skipTopics?.join(", ") || "None"}

Create a day-by-day learning plan in this EXACT JSON format:

{
  "title": "Personalized ${duration}-Day Coding Interview Prep",
  "description": "Comprehensive learning path tailored to your current skill level",
  "duration": ${duration},
  "difficulty": "${userLevel}",
  "goals": [
    "Master core data structures and algorithms",
    "Build interview confidence",
    "Improve problem-solving speed"
  ],
  "prerequisites": ["Basic programming knowledge", "Understanding of time complexity"],
  "days": [
    {
      "day": 1,
      "topic": "Arrays & Strings",
      "subtopic": "Two Pointers Technique",
      "problemCount": ${dailyProblems},
      "difficulty": "easy",
      "estimatedTime": "1.5-2 hours",
      "concepts": ["Two pointers", "Array traversal", "String manipulation"],
      "problems": [
        {
          "title": "Two Sum",
          "number": 1,
          "difficulty": "Easy",
          "url": "https://leetcode.com/problems/two-sum/",
          "topics": ["Array", "Hash Table"],
          "pattern": "Two Pointers",
          "estimatedTime": "30-45 minutes",
          "notes": "Classic problem to understand hash table optimization"
        }
      ],
      "goals": [
        "Understand two-pointer technique",
        "Practice array traversal",
        "Learn hash table optimization"
      ],
      "resources": [
        "https://leetcode.com/explore/learn/card/array-and-string/"
      ]
    }
  ],
  "customizations": {
    "dailyProblemCount": ${dailyProblems},
    "skipTopics": ${JSON.stringify(preferences?.skipTopics || [])},
    "focusAreas": ${JSON.stringify(preferences?.focusAreas || [])},
    "timeAvailable": "${preferences?.timeAvailable || "1-2 hours"}"
  }
}

Include these essential topics in order of importance:
1. Arrays & Strings (Days 1-7): Two pointers, sliding window, string algorithms
2. Linked Lists (Days 8-12): Traversal, manipulation, cycle detection
3. Stacks & Queues (Days 13-17): Basic operations, monotonic stack
4. Trees (Days 18-25): Traversal, BST operations, tree construction
5. Graphs (Days 26-32): DFS, BFS, shortest path
6. Dynamic Programming (Days 33-42): 1D DP, 2D DP, optimization
7. Sorting & Searching (Days 43-47): Binary search, sorting algorithms
8. Advanced Topics (Days 48-${duration}): Backtracking, greedy, bit manipulation

For each day, provide:
- 2-3 specific LeetCode problems with numbers and URLs
- Clear learning objectives
- Estimated time requirements
- Key concepts to master
- Common patterns to recognize

Progressive difficulty: Start with easier problems and gradually increase complexity.
Ensure problems build upon previous concepts and reinforce learning.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const aiPath = JSON.parse(jsonMatch[0]);
                
                return {
                    ...aiPath,
                    id: '', // Will be set after database insert
                    userId: '',
                    createdAt: new Date(),
                    status: 'generated' as const,
                    progress: {
                        daysCompleted: 0,
                        problemsCompleted: 0,
                        totalProblems: aiPath.days?.reduce((sum: number, day: any) => sum + day.problemCount, 0) || 0,
                        currentDay: 1
                    }
                };
            } else {
                throw new Error("No JSON found in AI response");
            }
        } catch (parseError) {
            console.error("Failed to parse learning path:", parseError);
            return generateFallbackLearningPath(userLevel, duration, dailyProblems);
        }

    } catch (error) {
        console.error("Error generating learning path:", error);
        return generateFallbackLearningPath('intermediate', 30, 2);
    }
}

function determineUserLevel(stats: any): 'beginner' | 'intermediate' | 'advanced' {
    if (stats.total < 50) return 'beginner';
    if (stats.total < 200) return 'intermediate';
    return 'advanced';
}

function calculateOptimalDuration(stats: any): number {
    const level = determineUserLevel(stats);
    switch (level) {
        case 'beginner': return 60; // 2 months
        case 'intermediate': return 45; // 1.5 months
        case 'advanced': return 30; // 1 month
        default: return 45;
    }
}

function generateFallbackLearningPath(userLevel: string, duration: number, dailyProblems: number): LearningPath {
    const fallbackDays: LearningPathDay[] = [];
    
    // Generate first 7 days as example
    for (let i = 1; i <= Math.min(7, duration); i++) {
        fallbackDays.push({
            day: i,
            topic: 'Arrays & Strings',
            subtopic: i <= 3 ? 'Basic Operations' : 'Two Pointers',
            problemCount: dailyProblems,
            difficulty: userLevel === 'beginner' ? 'easy' : 'medium',
            estimatedTime: '1-2 hours',
            concepts: ['Array traversal', 'String manipulation'],
            problems: [
                {
                    title: 'Two Sum',
                    number: 1,
                    difficulty: "Easy" as const,
                    url: 'https://leetcode.com/problems/two-sum/',
                    topics: ['Array', 'Hash Table'],
                    pattern: 'Hash Table',
                    estimatedTime: '30 minutes'
                },
                {
                    title: 'Valid Anagram',
                    number: 242,
                    difficulty: "Easy" as const,
                    url: 'https://leetcode.com/problems/valid-anagram/',
                    topics: ['String', 'Hash Table'],
                    pattern: 'Character Frequency',
                    estimatedTime: '20 minutes'
                }
            ].slice(0, dailyProblems),
            goals: ['Master basic array operations', 'Understand hash table usage']
        });
    }

    return {
        id: '',
        userId: '',
        title: `${userLevel.charAt(0).toUpperCase() + userLevel.slice(1)} ${duration}-Day Learning Path`,
        description: `Structured learning path for ${userLevel} level programmers`,
        duration,
        difficulty: userLevel as any,
        goals: ['Master fundamentals', 'Build interview confidence', 'Improve problem-solving'],
        prerequisites: ['Basic programming knowledge'],
        days: fallbackDays,
        createdAt: new Date(),
        status: 'generated',
        progress: {
            daysCompleted: 0,
            problemsCompleted: 0,
            totalProblems: fallbackDays.length * dailyProblems,
            currentDay: 1
        },
        customizations: {
            dailyProblemCount: dailyProblems,
            skipTopics: [],
            focusAreas: [],
            timeAvailable: '1-2 hours'
        }
    };
}