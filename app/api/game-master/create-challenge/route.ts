import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

const LEETCODE_PROBLEMS_API = "https://leetcode.com/api/problems/all/";

interface LeetCodeProblem {
    stat: {
        question_id: number;
        question__title: string;
        question__title_slug: string;
        question__hide: boolean;
        total_acs: number;
        total_submitted: number;
        frontend_question_id: number;
        is_new_question: boolean;
    };
    difficulty: {
        level: number;
    };
    paid_only: boolean;
    is_favor: boolean;
    frequency: number;
    progress: number;
}

async function fetchLeetCodeProblems(): Promise<LeetCodeProblem[]> {
    try {
        const response = await fetch(LEETCODE_PROBLEMS_API);
        if (!response.ok) throw new Error('Failed to fetch LeetCode problems');

        const data = await response.json();
        return data.stat_status_pairs || [];
    } catch (error) {
        console.error('Error fetching LeetCode problems:', error);
        return [];
    }
}

function getDifficultyLevel(difficulty: string): number {
    switch (difficulty.toLowerCase()) {
        case 'easy': return 1;
        case 'medium': return 2;
        case 'hard': return 3;
        default: return 2;
    }
}

function filterProblemsByTopic(problems: LeetCodeProblem[], topic?: string): LeetCodeProblem[] {
    if (!topic) return problems;

    // This is a simplified topic filter - in a real implementation you'd want
    // to have a mapping of problems to topics or use LeetCode's tag system
    const topicKeywords = topic.toLowerCase().split(' ');
    return problems.filter(problem => {
        const title = problem.stat.question__title.toLowerCase();
        return topicKeywords.some(keyword => title.includes(keyword));
    });
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        console.log('Create challenge request body:', body);

        const { partyCode, difficulty = 'Medium', topic, timerMinutes = 30 } = body;

        if (!partyCode) {
            return NextResponse.json({ error: "Party code is required" }, { status: 400 });
        }

        const db = await connectToDatabase();
        const parties = db.collection("parties");
        const challenges = db.collection("challenges");

        // Verify party exists and user is owner
        const party = await parties.findOne({ code: partyCode });
        if (!party) {
            return NextResponse.json({ error: "Party not found" }, { status: 404 });
        }

        const isOwner = party.members.some((member: any) =>
            member.email === session.user?.email && member.isOwner
        );

        if (!isOwner) {
            return NextResponse.json({ error: "Only party owners can create challenges" }, { status: 403 });
        }

        console.log('Fetching LeetCode problems...');

        // Fetch LeetCode problems
        const allProblems = await fetchLeetCodeProblems();
        console.log('LeetCode problems fetched:', allProblems.length);

        if (allProblems.length === 0) {
            console.error('No LeetCode problems found');
            return NextResponse.json({ error: "Failed to fetch LeetCode problems" }, { status: 500 });
        }

        // Filter problems by difficulty and topic
        const difficultyLevel = getDifficultyLevel(difficulty);
        let filteredProblems = allProblems.filter(problem =>
            problem.difficulty.level === difficultyLevel &&
            !problem.paid_only &&
            !problem.stat.question__hide
        );

        console.log(`Filtered problems by difficulty ${difficulty}:`, filteredProblems.length);

        if (topic) {
            filteredProblems = filterProblemsByTopic(filteredProblems, topic);
            console.log(`Filtered problems by topic ${topic}:`, filteredProblems.length);
        }

        if (filteredProblems.length === 0) {
            return NextResponse.json({
                error: "No problems found matching your criteria. Try different difficulty or topic."
            }, { status: 400 });
        }

        // Select a random problem
        const randomProblem = filteredProblems[Math.floor(Math.random() * filteredProblems.length)];
        const acceptanceRate = Math.round((randomProblem.stat.total_acs / randomProblem.stat.total_submitted) * 100);

        console.log('Selected problem:', randomProblem.stat.question__title);

        // Create challenge object
        const challenge = {
            partyCode,
            leetcodeProblem: {
                title: randomProblem.stat.question__title,
                slug: randomProblem.stat.question__title_slug,
                difficulty: difficulty,
                url: `https://leetcode.com/problems/${randomProblem.stat.question__title_slug}/`,
                description: "Click the link to view the full problem statement on LeetCode.",
                acceptance: `${acceptanceRate}%`,
                tags: topic ? [topic] : ['Algorithm'], // Simplified - you'd want real tags
                questionId: randomProblem.stat.frontend_question_id
            },
            createdBy: session.user.email,
            createdAt: new Date(),
            startTime: new Date(),
            endTime: new Date(Date.now() + timerMinutes * 60 * 1000),
            timerMinutes,
            status: 'active',
            submissions: []
        };

        const result = await challenges.insertOne(challenge);
        console.log('Challenge created successfully:', result.insertedId);

        return NextResponse.json({
            success: true,
            challenge: {
                _id: result.insertedId,
                ...challenge
            },
            message: "Challenge created successfully!"
        });

    } catch (error) {
        console.error("Create challenge error:", error);
        return NextResponse.json({
            error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 500 });
    }
}
