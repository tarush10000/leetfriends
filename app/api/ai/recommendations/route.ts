import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface LeetCodeStats {
    easy: number;
    medium: number;
    hard: number;
    total: number;
}

interface UserProfile {
    handle: string;
    leetcodeUsername: string;
    displayName: string;
    onboarded: boolean;
}

interface Recommendation {
    id: string;
    type: 'weakness' | 'consistency' | 'interview_prep' | 'advanced' | 'foundation';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionItems: string[];
    estimatedTime: string;
    reasoning: string;
    focusAreas: string[];
}

interface TopicWeakness {
    topic: string;
    confidenceScore: number;
    problemsSolved: number;
    recommendedActions: string[];
    aiInsights: string;
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
        }

        const { userProfile, leetcodeStats } = await req.json();

        // Generate AI-powered recommendations and weaknesses analysis
        const [recommendations, weaknesses] = await Promise.all([
            generateAIRecommendations(userProfile, leetcodeStats),
            analyzeWeaknessesWithAI(userProfile, leetcodeStats)
        ]);

        return NextResponse.json({
            recommendations,
            weaknesses,
            generatedAt: new Date().toISOString(),
            totalProblems: leetcodeStats.total
        });

    } catch (error) {
        console.error("AI Recommendations error:", error);
        // Parse the request body to get leetcodeStats for fallback
        let leetcodeStats: LeetCodeStats = { easy: 0, medium: 0, hard: 0, total: 0 };
        try {
            const body = await req.json();
            if (body?.leetcodeStats) {
                leetcodeStats = body.leetcodeStats;
            }
        } catch (e) {
            console.error("Failed to parse request body for fallback stats:", e);
        }
        return NextResponse.json({ 
            error: "Failed to generate recommendations",
            fallback: generateFallbackRecommendations(leetcodeStats)
        }, { status: 500 });
    }
}

async function generateAIRecommendations(userProfile: UserProfile, stats: LeetCodeStats): Promise<Recommendation[]> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are an expert coding interview coach analyzing a software engineer's LeetCode progress. Generate personalized recommendations based on their statistics.

User Profile:
- LeetCode Username: ${userProfile.leetcodeUsername}
- Display Name: ${userProfile.displayName}

Current LeetCode Statistics:
- Easy Problems: ${stats.easy}
- Medium Problems: ${stats.medium}  
- Hard Problems: ${stats.hard}
- Total Problems: ${stats.total}

Analysis Context:
- Industry benchmark: 300+ problems for strong preparation
- Typical distribution: 40% Easy, 45% Medium, 15% Hard
- FAANG interview focus: Medium (60%) + Hard (40%)

Please provide 3-4 specific, actionable recommendations in JSON format:

{
  "recommendations": [
    {
      "id": "unique_id",
      "type": "weakness|consistency|interview_prep|advanced|foundation",
      "title": "Clear, actionable title",
      "description": "Detailed explanation of why this matters",
      "priority": "high|medium|low",
      "actionItems": ["Specific action 1", "Specific action 2", "Specific action 3"],
      "estimatedTime": "Realistic timeframe",
      "reasoning": "Data-driven explanation based on their stats",
      "focusAreas": ["Specific topics/patterns to focus on"]
    }
  ]
}

Guidelines:
- Be specific about weaknesses based on actual ratios
- Include concrete next steps, not generic advice
- Consider their current level (beginner/intermediate/advanced)
- Focus on practical improvements for interviews
- Base priority on impact vs effort ratio`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse JSON from AI response
        let aiRecommendations;
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiRecommendations = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON found in AI response");
            }
        } catch (parseError) {
            console.error("Failed to parse AI recommendations:", parseError);
            return generateFallbackRecommendations(stats);
        }

        return aiRecommendations.recommendations || [];

    } catch (error) {
        console.error("Error generating AI recommendations:", error);
        return generateFallbackRecommendations(stats);
    }
}

async function analyzeWeaknessesWithAI(userProfile: UserProfile, stats: LeetCodeStats): Promise<TopicWeakness[]> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Analyze coding weaknesses based on LeetCode statistics and provide topic-specific insights.

User Statistics:
- Easy: ${stats.easy} problems
- Medium: ${stats.medium} problems  
- Hard: ${stats.hard} problems
- Total: ${stats.total} problems

Based on these statistics, identify 4-5 key topic areas that need improvement. Consider:
- Problem distribution suggests certain algorithmic weaknesses
- Total volume indicates experience level
- Ratios reveal preparation gaps

Provide analysis in JSON format:

{
  "weaknesses": [
    {
      "topic": "Specific algorithmic topic",
      "confidenceScore": 0.0-1.0,
      "problemsSolved": "estimated count for this topic",
      "recommendedActions": ["Action 1", "Action 2", "Action 3"],
      "aiInsights": "Detailed explanation of why this is weak and how to improve"
    }
  ]
}

Focus on:
- Dynamic Programming (if medium/hard ratio is low)
- Graph Algorithms (critical for interviews)
- Tree/Binary Search (fundamental concepts)
- Two Pointers/Sliding Window (optimization techniques)
- System Design Basics (if total > 200)

Be specific about the connection between their stats and the identified weaknesses.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        let aiWeaknesses;
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiWeaknesses = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON found in AI response");
            }
        } catch (parseError) {
            console.error("Failed to parse AI weaknesses:", parseError);
            return generateFallbackWeaknesses(stats);
        }

        return aiWeaknesses.weaknesses || [];

    } catch (error) {
        console.error("Error analyzing weaknesses with AI:", error);
        return generateFallbackWeaknesses(stats);
    }
}

function generateFallbackRecommendations(stats: LeetCodeStats): Recommendation[] {
    const total = stats.total;
    const recommendations: Recommendation[] = [];

    // Foundation building
    if (total < 50) {
        recommendations.push({
            id: 'build_foundation',
            type: 'foundation',
            title: 'Build Strong Foundations',
            description: 'Focus on fundamental data structures and algorithms before advancing to complex problems.',
            priority: 'high',
            actionItems: [
                'Master arrays, strings, and hash tables',
                'Practice basic recursion problems',
                'Learn Big O notation analysis',
                'Solve 5 problems daily for 2 weeks'
            ],
            estimatedTime: '2-3 weeks',
            reasoning: `With ${total} problems solved, building strong fundamentals is crucial before tackling advanced concepts.`,
            focusAreas: ['Arrays', 'Strings', 'Hash Tables', 'Basic Math']
        });
    }

    // Medium problem focus
    if (stats.medium < total * 0.4 && total > 30) {
        recommendations.push({
            id: 'focus_medium',
            type: 'weakness',
            title: 'Strengthen Medium Problem Solving',
            description: 'Medium problems form the core of technical interviews. Improve your success rate here.',
            priority: 'high',
            actionItems: [
                'Practice binary search variations',
                'Master tree traversal algorithms',
                'Study dynamic programming basics',
                'Solve 3 medium problems daily'
            ],
            estimatedTime: '3-4 weeks',
            reasoning: `Your medium problem ratio (${Math.round((stats.medium/total)*100)}%) is below the recommended 40-45%.`,
            focusAreas: ['Binary Search', 'Trees', 'Dynamic Programming', 'Graphs']
        });
    }

    // Hard problem advancement
    if (stats.hard < total * 0.1 && total > 100) {
        recommendations.push({
            id: 'advance_hard',
            type: 'advanced',
            title: 'Master Hard Problem Techniques',
            description: 'Hard problems test advanced algorithmic thinking required for senior roles.',
            priority: 'medium',
            actionItems: [
                'Study advanced DP patterns',
                'Learn graph algorithms (Dijkstra, Union-Find)',
                'Practice optimization problems',
                'Solve 1 hard problem every 2 days'
            ],
            estimatedTime: '4-6 weeks',
            reasoning: `With only ${stats.hard} hard problems (${Math.round((stats.hard/total)*100)}%), advancing here will significantly improve your profile.`,
            focusAreas: ['Advanced DP', 'Graph Algorithms', 'Optimization', 'Complex Data Structures']
        });
    }

    return recommendations;
}

function generateFallbackWeaknesses(stats: LeetCodeStats): TopicWeakness[] {
    const weaknesses: TopicWeakness[] = [];

    // Dynamic Programming weakness
    if (stats.medium + stats.hard < 50) {
        weaknesses.push({
            topic: 'Dynamic Programming',
            confidenceScore: Math.min(0.8, (stats.medium + stats.hard) / 50),
            problemsSolved: Math.floor((stats.medium + stats.hard) * 0.2),
            recommendedActions: [
                'Study the DP patterns (1D, 2D, optimized)',
                'Practice classic problems (Coin Change, LIS, Edit Distance)',
                'Master memoization vs tabulation approaches'
            ],
            aiInsights: 'Dynamic Programming is crucial for 60% of medium/hard interview questions. Your current stats suggest limited exposure to these patterns.'
        });
    }

    // Graph algorithms
    if (stats.hard < 20) {
        weaknesses.push({
            topic: 'Graph Algorithms',
            confidenceScore: Math.min(0.9, stats.hard / 20),
            problemsSolved: Math.floor(stats.hard * 0.3),
            recommendedActions: [
                'Master BFS and DFS traversals',
                'Learn shortest path algorithms',
                'Practice topological sorting'
            ],
            aiInsights: 'Graph problems appear in 40% of interviews at top companies. Building expertise here will significantly improve your problem-solving toolkit.'
        });
    }

    return weaknesses;
}