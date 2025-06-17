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
    type: 'weakness' | 'consistency' | 'interview_prep' | 'advanced' | 'foundation' | 'optimization';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionItems: string[];
    estimatedTime: string;
    reasoning: string;
    focusAreas: string[];
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
    impact: number; // 1-10 scale
}

interface TopicAnalysis {
    topic: string;
    category: 'data_structures' | 'algorithms' | 'techniques' | 'advanced';
    currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    confidenceScore: number; // 0-100
    problemsSolved: number;
    recommendedProblems: number;
    strengths: string[];
    weaknesses: string[];
    nextSteps: string[];
    priorityLevel: 'high' | 'medium' | 'low';
    estimatedTimeToImprove: string;
    keyPatterns: string[];
    commonMistakes: string[];
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

        // Generate comprehensive analysis
        const [recommendations, topicAnalysis, overallInsights] = await Promise.all([
            generateEnhancedRecommendations(userProfile, leetcodeStats),
            generateTopicAnalysis(userProfile, leetcodeStats),
            generateOverallInsights(userProfile, leetcodeStats)
        ]);

        return NextResponse.json({
            recommendations,
            topicAnalysis,
            overallInsights,
            metadata: {
                generatedAt: new Date().toISOString(),
                totalProblems: leetcodeStats.total,
                analysisVersion: '2.0',
                confidence: calculateAnalysisConfidence(leetcodeStats)
            }
        });

    } catch (error) {
        console.error("Enhanced AI Recommendations error:", error);
        return NextResponse.json({ 
            error: "Failed to generate recommendations"
        }, { status: 500 });
    }
}

async function generateEnhancedRecommendations(userProfile: UserProfile, stats: LeetCodeStats): Promise<Recommendation[]> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const difficultyRatio = {
            easy: stats.total > 0 ? (stats.easy / stats.total) * 100 : 0,
            medium: stats.total > 0 ? (stats.medium / stats.total) * 100 : 0,
            hard: stats.total > 0 ? (stats.hard / stats.total) * 100 : 0
        };

        const userLevel = determineUserLevel(stats);
        const interviewReadiness = calculateInterviewReadiness(stats);

        const prompt = `You are an expert coding interview coach and competitive programming mentor. Analyze this user's LeetCode progress and provide detailed, actionable recommendations.

User Profile:
- LeetCode Username: ${userProfile.leetcodeUsername}
- Display Name: ${userProfile.displayName}
- Current Level: ${userLevel}

Statistics Analysis:
- Easy Problems: ${stats.easy} (${difficultyRatio.easy.toFixed(1)}%)
- Medium Problems: ${stats.medium} (${difficultyRatio.medium.toFixed(1)}%)
- Hard Problems: ${stats.hard} (${difficultyRatio.hard.toFixed(1)}%)
- Total Problems: ${stats.total}
- Interview Readiness: ${interviewReadiness}%

Benchmarks for Analysis:
- Industry Standard: 300+ problems for strong interviews
- Optimal Distribution: 30% Easy, 50% Medium, 20% Hard
- FAANG Preparation: Focus on Medium (60%) + Hard (40%)
- Competitive Programming: Heavy emphasis on Hard problems

Provide 4-6 specific, actionable recommendations in this EXACT JSON format:

{
  "recommendations": [
    {
      "id": "unique_identifier",
      "type": "weakness|consistency|interview_prep|advanced|foundation|optimization",
      "title": "Clear, specific title (max 50 chars)",
      "description": "Detailed explanation of the recommendation and its importance",
      "priority": "high|medium|low",
      "actionItems": [
        "Specific action 1 with numbers/targets",
        "Specific action 2 with timeline",
        "Specific action 3 with measurable goals"
      ],
      "estimatedTime": "Realistic timeframe (e.g., '2-3 weeks', '1 month')",
      "reasoning": "Data-driven explanation based on their specific stats and ratios",
      "focusAreas": ["Specific topic 1", "Specific topic 2", "Specific topic 3"],
      "difficulty": "easy|medium|hard|mixed",
      "impact": 8
    }
  ]
}

Focus on:
1. Statistical analysis of their current distribution vs optimal
2. Specific weaknesses based on problem count and ratios
3. Interview preparation gaps
4. Skill progression recommendations
5. Time-bound, measurable goals
6. Learning efficiency optimization

Make recommendations specific to their current level and provide actionable next steps.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        let aiRecommendations;
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiRecommendations = JSON.parse(jsonMatch[0]);
                return aiRecommendations.recommendations || [];
            } else {
                throw new Error("No JSON found in AI response");
            }
        } catch (parseError) {
            console.error("Failed to parse AI recommendations:", parseError);
            return generateFallbackRecommendations(stats);
        }

    } catch (error) {
        console.error("Error generating enhanced recommendations:", error);
        return generateFallbackRecommendations(stats);
    }
}

async function generateTopicAnalysis(userProfile: UserProfile, stats: LeetCodeStats): Promise<TopicAnalysis[]> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Analyze this user's coding skills by topic area based on their LeetCode statistics. Provide detailed topic-wise analysis.

User Statistics:
- Easy: ${stats.easy} problems
- Medium: ${stats.medium} problems  
- Hard: ${stats.hard} problems
- Total: ${stats.total} problems

Based on typical problem distributions and the user's current stats, analyze their likely performance in each topic area. Provide analysis in this EXACT JSON format:

{
  "topicAnalysis": [
    {
      "topic": "Arrays & Strings",
      "category": "data_structures",
      "currentLevel": "beginner|intermediate|advanced|expert",
      "confidenceScore": 75,
      "problemsSolved": 15,
      "recommendedProblems": 25,
      "strengths": ["Two pointers", "Basic operations"],
      "weaknesses": ["Sliding window", "Advanced string algorithms"],
      "nextSteps": ["Practice sliding window problems", "Study KMP algorithm"],
      "priorityLevel": "high|medium|low",
      "estimatedTimeToImprove": "2-3 weeks",
      "keyPatterns": ["Two pointers", "Sliding window", "Prefix sums"],
      "commonMistakes": ["Off-by-one errors", "Not handling edge cases"]
    }
  ]
}

Analyze these core topics:
1. Arrays & Strings (most common in interviews)
2. Linked Lists (fundamental data structure)
3. Trees & Graphs (critical for system design)
4. Dynamic Programming (hard but high-impact)
5. Hash Tables & Maps (optimization technique)
6. Sorting & Searching (foundational algorithms)
7. Stack & Queue (data structure applications)
8. Recursion & Backtracking (problem-solving technique)
9. Greedy Algorithms (optimization strategy)
10. Bit Manipulation (efficiency optimization)

For each topic, estimate based on:
- Typical distribution in Easy/Medium/Hard problems
- User's current problem counts
- Interview frequency and importance
- Learning curve and prerequisites`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                return analysis.topicAnalysis || [];
            } else {
                throw new Error("No JSON found in AI response");
            }
        } catch (parseError) {
            console.error("Failed to parse topic analysis:", parseError);
            return generateFallbackTopicAnalysis(stats);
        }

    } catch (error) {
        console.error("Error generating topic analysis:", error);
        return generateFallbackTopicAnalysis(stats);
    }
}

async function generateOverallInsights(userProfile: UserProfile, stats: LeetCodeStats) {
    const userLevel = determineUserLevel(stats);
    const interviewReadiness = calculateInterviewReadiness(stats);
    const strengthAreas = identifyStrengthAreas(stats);
    const improvementAreas = identifyImprovementAreas(stats);

    return {
        userLevel,
        interviewReadiness,
        strengthAreas,
        improvementAreas,
        nextMilestone: getNextMilestone(stats),
        studyIntensity: recommendStudyIntensity(stats),
        timeToInterviewReady: estimateTimeToReady(stats)
    };
}

function determineUserLevel(stats: LeetCodeStats): string {
    if (stats.total < 50) return 'beginner';
    if (stats.total < 150) return 'intermediate';
    if (stats.total < 300) return 'advanced';
    return 'expert';
}

function calculateInterviewReadiness(stats: LeetCodeStats): number {
    const totalWeight = stats.total * 0.3;
    const mediumWeight = stats.medium * 0.5;
    const hardWeight = stats.hard * 0.7;
    const readiness = Math.min((totalWeight + mediumWeight + hardWeight) / 200 * 100, 100);
    return Math.round(readiness);
}

function calculateAnalysisConfidence(stats: LeetCodeStats): number {
    if (stats.total < 10) return 30;
    if (stats.total < 50) return 60;
    if (stats.total < 100) return 80;
    return 95;
}

function identifyStrengthAreas(stats: LeetCodeStats): string[] {
    const areas = [];
    if (stats.easy > 30) areas.push('Fundamental concepts');
    if (stats.medium > 50) areas.push('Intermediate problem solving');
    if (stats.hard > 20) areas.push('Advanced algorithms');
    if (stats.total > 200) areas.push('Consistency and practice');
    return areas;
}

function identifyImprovementAreas(stats: LeetCodeStats): string[] {
    const areas = [];
    const easyRatio = stats.total > 0 ? stats.easy / stats.total : 0;
    const mediumRatio = stats.total > 0 ? stats.medium / stats.total : 0;
    const hardRatio = stats.total > 0 ? stats.hard / stats.total : 0;

    if (easyRatio > 0.5) areas.push('Move beyond easy problems');
    if (mediumRatio < 0.4) areas.push('Practice more medium problems');
    if (hardRatio < 0.1 && stats.total > 100) areas.push('Challenge yourself with hard problems');
    if (stats.total < 100) areas.push('Increase problem-solving volume');
    
    return areas;
}

function getNextMilestone(stats: LeetCodeStats): { target: number; description: string } {
    if (stats.total < 50) return { target: 50, description: 'Complete 50 problems to build foundation' };
    if (stats.total < 100) return { target: 100, description: 'Reach 100 problems for solid practice' };
    if (stats.total < 200) return { target: 200, description: 'Hit 200 problems for interview confidence' };
    if (stats.total < 300) return { target: 300, description: 'Achieve 300 problems for strong preparation' };
    return { target: 500, description: 'Master 500 problems for expert level' };
}

function recommendStudyIntensity(stats: LeetCodeStats): string {
    if (stats.total < 50) return '1-2 problems daily, focus on understanding';
    if (stats.total < 150) return '2-3 problems daily, build consistency';
    if (stats.total < 300) return '3-4 problems daily, target weak areas';
    return '2-3 problems daily, focus on hard problems and optimization';
}

function estimateTimeToReady(stats: LeetCodeStats): string {
    const problemsNeeded = Math.max(0, 200 - stats.total);
    const weeksNeeded = Math.ceil(problemsNeeded / 14); // 2 problems per day
    
    if (weeksNeeded <= 0) return 'Ready now!';
    if (weeksNeeded <= 4) return `${weeksNeeded} weeks with consistent practice`;
    if (weeksNeeded <= 12) return `${Math.ceil(weeksNeeded / 4)} months with regular practice`;
    return '6+ months with dedicated practice';
}

function generateFallbackRecommendations(stats: LeetCodeStats): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Always include consistency recommendation
    recommendations.push({
        id: 'consistency_fallback',
        type: 'consistency',
        title: 'Build Daily Practice Habit',
        description: 'Consistency is the key to mastering coding interviews. Regular practice builds pattern recognition and problem-solving speed.',
        priority: 'high',
        actionItems: [
            'Solve 1-2 problems every day',
            'Set a specific time for practice',
            'Track your streak and celebrate milestones',
            'Join coding communities for motivation'
        ],
        estimatedTime: '2-3 weeks to establish habit',
        reasoning: 'Regular practice is more effective than intensive cramming sessions.',
        focusAreas: ['Time Management', 'Habit Building', 'Consistency'],
        difficulty: 'mixed',
        impact: 9
    });

    // Add foundation recommendation for beginners
    if (stats.total < 100) {
        recommendations.push({
            id: 'foundation_fallback',
            type: 'foundation',
            title: 'Master Core Data Structures',
            description: 'Build a strong foundation in essential data structures that appear in most coding interviews.',
            priority: 'high',
            actionItems: [
                'Practice array and string manipulation (20 problems)',
                'Master linked list operations (15 problems)',
                'Understand hash table implementations (10 problems)',
                'Study basic tree traversals (15 problems)'
            ],
            estimatedTime: '3-4 weeks',
            reasoning: `With ${stats.total} problems solved, focusing on fundamentals will provide the best ROI.`,
            focusAreas: ['Arrays', 'Strings', 'Linked Lists', 'Hash Tables', 'Trees'],
            difficulty: 'easy',
            impact: 8
        });
    }

    return recommendations;
}

function generateFallbackTopicAnalysis(stats: LeetCodeStats): TopicAnalysis[] {
    const totalProblems = stats.total;
    const level = determineUserLevel(stats);
    
    return [
        {
            topic: 'Arrays & Strings',
            category: 'data_structures',
            currentLevel: level as any,
            confidenceScore: Math.min(Math.round((stats.easy * 2 + stats.medium) / totalProblems * 100), 100),
            problemsSolved: Math.round(totalProblems * 0.3),
            recommendedProblems: 30,
            strengths: ['Basic operations', 'Linear traversal'],
            weaknesses: ['Two pointers', 'Sliding window'],
            nextSteps: ['Practice two-pointer technique', 'Master sliding window patterns'],
            priorityLevel: 'high',
            estimatedTimeToImprove: '2-3 weeks',
            keyPatterns: ['Two Pointers', 'Sliding Window', 'Prefix Sums'],
            commonMistakes: ['Off-by-one errors', 'Not handling edge cases']
        },
        {
            topic: 'Dynamic Programming',
            category: 'algorithms',
            currentLevel: stats.hard > 10 ? 'intermediate' : 'beginner',
            confidenceScore: Math.round(stats.hard * 5),
            problemsSolved: Math.round(stats.hard * 0.4),
            recommendedProblems: 25,
            strengths: [],
            weaknesses: ['State definition', 'Transition relations'],
            nextSteps: ['Start with 1D DP problems', 'Practice classic DP patterns'],
            priorityLevel: 'medium',
            estimatedTimeToImprove: '4-6 weeks',
            keyPatterns: ['1D DP', '2D DP', 'Memoization'],
            commonMistakes: ['Incorrect state definition', 'Missing base cases']
        }
    ];
}