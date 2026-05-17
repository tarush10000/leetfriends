// app/api/interview-prep/mark-solved-completed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

const LEETCODE_API_URL = "https://leetcode.com/graphql";

interface LeetCodeSubmission {
    statusDisplay: string;
    timestamp: string;
    question: {
        questionFrontendId: string;
        title: string;
        titleSlug: string;
        difficulty: string;
    };
}

// Fetch user's solved problems from LeetCode using multiple strategies
async function fetchUserSolvedProblems(username: string): Promise<{problemIds: number[], totalSolved: number}> {
    try {
        // First, get user stats to know total solved count
        const statsResponse = await fetch(LEETCODE_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            body: JSON.stringify({
                query: `
                    query getUserProfile($username: String!) {
                        matchedUser(username: $username) {
                            submitStats {
                                acSubmissionNum {
                                    difficulty
                                    count
                                }
                            }
                        }
                    }
                `,
                variables: { username }
            }),
        });

        if (!statsResponse.ok) {
            throw new Error(`HTTP error! status: ${statsResponse.status}`);
        }

        const statsData = await statsResponse.json();
        
        if (!statsData.data?.matchedUser?.submitStats?.acSubmissionNum) {
            throw new Error('User not found or has no accepted submissions');
        }

        const stats = statsData.data.matchedUser.submitStats.acSubmissionNum;
        const totalSolved = stats.reduce((sum: number, s: any) => sum + s.count, 0);
        
        console.log(`User ${username} has ${totalSolved} total solved problems`);

        if (totalSolved === 0) {
            return { problemIds: [], totalSolved: 0 };
        }

        // Try multiple approaches to get as many problem IDs as possible
        const allProblemIds = new Set<number>();

        // Approach 1: Recent submissions (most reliable)
        try {
            const recentSubmissions = await fetchRecentSubmissions(username, Math.min(2000, totalSolved * 3));
            recentSubmissions.forEach(id => allProblemIds.add(id));
            console.log(`Found ${recentSubmissions.length} problems from recent submissions`);
        } catch (error) {
            console.log('Recent submissions failed:', error instanceof Error ? error.message : 'Unknown error');
        }

        // Approach 2: Try to get solved problems list (newer LeetCode API)
        try {
            const solvedProblems = await fetchSolvedProblemsList(username);
            solvedProblems.forEach(id => allProblemIds.add(id));
            console.log(`Found ${solvedProblems.length} problems from solved problems list`);
        } catch (error) {
            console.log('Solved problems list failed:', error instanceof Error ? error.message : 'Unknown error');
        }

        const problemIds = Array.from(allProblemIds);
        console.log(`Total unique problem IDs found: ${problemIds.length} out of ${totalSolved} total solved`);
        
        return { problemIds, totalSolved };

    } catch (error) {
        console.error('Error fetching LeetCode data:', error);
        throw error;
    }
}

// Fetch recent submissions
async function fetchRecentSubmissions(username: string, limit: number): Promise<number[]> {
    const response = await fetch(LEETCODE_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: JSON.stringify({
            query: `
                query recentAcSubmissions($username: String!, $limit: Int!) {
                    recentAcSubmissionList(username: $username, limit: $limit) {
                        statusDisplay
                        timestamp
                        question {
                            questionFrontendId
                            title
                            titleSlug
                        }
                    }
                }
            `,
            variables: { username, limit }
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errors) {
        throw new Error('GraphQL errors: ' + JSON.stringify(data.errors));
    }

    const submissions: LeetCodeSubmission[] = data.data?.recentAcSubmissionList || [];
    const problemIds: number[] = [];

    submissions.forEach(submission => {
        if (submission.statusDisplay === "Accepted") {
            const problemId = parseInt(submission.question.questionFrontendId);
            if (!isNaN(problemId)) {
                problemIds.push(problemId);
            }
        }
    });

    return [...new Set(problemIds)]; // Remove duplicates
}

// Try to fetch solved problems using profile query
async function fetchSolvedProblemsList(username: string): Promise<number[]> {
    const response = await fetch(LEETCODE_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: JSON.stringify({
            query: `
                query userProfile($username: String!) {
                    matchedUser(username: $username) {
                        submitStatsGlobal {
                            acSubmissionNum {
                                difficulty
                                count
                            }
                        }
                        profile {
                            userAvatar
                            realName
                        }
                    }
                    recentSubmissionList(username: $username) {
                        title
                        titleSlug
                        timestamp
                        statusDisplay
                        lang
                        question {
                            questionFrontendId
                            __typename
                        }
                        __typename
                    }
                }
            `,
            variables: { username }
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errors) {
        throw new Error('GraphQL errors: ' + JSON.stringify(data.errors));
    }

    const submissions = data.data?.recentSubmissionList || [];
    const problemIds: number[] = [];

    submissions.forEach((submission: any) => {
        if (submission.statusDisplay === "Accepted") {
            const problemId = parseInt(submission.question?.questionFrontendId);
            if (!isNaN(problemId)) {
                problemIds.push(problemId);
            }
        }
    });

    return [...new Set(problemIds)]; // Remove duplicates
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { leetcodeUsername, bulkMarkAll = false } = await req.json();

        if (!leetcodeUsername) {
            return NextResponse.json({ error: "LeetCode username is required" }, { status: 400 });
        }

        console.log(`Starting sync for user: ${leetcodeUsername}, bulkMarkAll: ${bulkMarkAll}`);

        const db = await connectToDatabase();
        const progressCollection = db.collection("interview_progress");
        const questionsCollection = db.collection("interview_questions");

        // If bulkMarkAll is true, mark all questions as completed (fallback option)
        if (bulkMarkAll) {
            console.log('Bulk marking all questions as completed...');
            
            // Get all questions in the interview database
            const allQuestions = await questionsCollection.find({}).toArray();
            
            // Get already completed questions for this user
            const existingProgress = await progressCollection.find({
                userEmail: session.user.email
            }).toArray();

            const alreadyCompleted = new Set(existingProgress.map(p => p.questionId));

            // Filter out questions that are already marked as completed
            const questionsToMark = allQuestions.filter(q => 
                !alreadyCompleted.has(q.question_id)
            );

            if (questionsToMark.length > 0) {
                const completionRecords = questionsToMark.map(question => ({
                    userEmail: session.user!.email,
                    questionId: question.question_id,
                    questionTitle: question.title,
                    difficulty: question.difficulty,
                    company: question.companies?.[0]?.name || 'Unknown',
                    completedAt: new Date(),
                    source: 'bulk_mark_all',
                    topics: question.topics || []
                }));

                await progressCollection.insertMany(completionRecords);
            }

            return NextResponse.json({
                success: true,
                message: `Bulk marked ${questionsToMark.length} questions as completed`,
                markedCount: questionsToMark.length,
                totalQuestions: allQuestions.length,
                note: "All questions in the interview database have been marked as completed."
            });
        }

        // Try to fetch user's solved problems from LeetCode
        let result: {problemIds: number[], totalSolved: number};
        let fetchError: string | null = null;

        try {
            result = await fetchUserSolvedProblems(leetcodeUsername);
            console.log(`Successfully fetched ${result.problemIds.length} specific solved problem IDs out of ${result.totalSolved} total`);
        } catch (error) {
            fetchError = error instanceof Error ? error.message : "Unknown error";
            console.error(`Failed to fetch LeetCode data: ${fetchError}`);
            
            // Check if this is a "user not found" vs "API unavailable" error
            if (fetchError.includes('User not found') || fetchError.includes('no accepted submissions')) {
                return NextResponse.json({ 
                    success: true,
                    message: "No solved problems found for this username",
                    markedCount: 0,
                    note: "Please verify your LeetCode username is correct and you have solved problems."
                });
            }
            
            return NextResponse.json({ 
                error: "Unable to automatically sync from LeetCode",
                details: fetchError,
                suggestion: "LeetCode's API may be temporarily unavailable. You can manually mark problems as completed, or try again later.",
                fallbackMode: true,
                canBulkMark: true
            }, { status: 422 });
        }

        if (result.problemIds.length === 0 && result.totalSolved > 0) {
            return NextResponse.json({ 
                success: false,
                message: "Could not fetch specific solved problems",
                markedCount: 0,
                totalSolved: result.totalSolved,
                suggestion: "LeetCode's recent submissions don't include all your solved problems. You can use the bulk mark option to mark all questions as completed.",
                canBulkMark: true,
                bulkMarkMessage: `You have ${result.totalSolved} solved problems on LeetCode, but we could only access recent submissions. Would you like to mark all interview questions as completed instead?`
            });
        }

        if (result.problemIds.length === 0) {
            return NextResponse.json({ 
                success: true,
                message: "No solved problems found to sync",
                markedCount: 0,
                note: "No solved problems found for this username."
            });
        }

        // Get all questions from the interview questions database that match solved problems
        const availableQuestions = await questionsCollection.find({
            question_id: { $in: result.problemIds }
        }).toArray();

        console.log(`Found ${availableQuestions.length} matching questions in interview database out of ${result.problemIds.length} solved problems`);

        // Get already completed questions for this user
        const existingProgress = await progressCollection.find({
            userEmail: session.user.email
        }).toArray();

        const alreadyCompleted = new Set(existingProgress.map(p => p.questionId));

        // Filter out questions that are already marked as completed
        const questionsToMark = availableQuestions.filter(q => 
            !alreadyCompleted.has(q.question_id)
        );

        console.log(`${questionsToMark.length} new questions to mark as completed`);

        // Mark questions as completed in bulk
        if (questionsToMark.length > 0) {
            const completionRecords = questionsToMark.map(question => ({
                userEmail: session.user!.email,
                questionId: question.question_id,
                questionTitle: question.title,
                difficulty: question.difficulty,
                company: question.companies?.[0]?.name || 'Unknown',
                completedAt: new Date(),
                source: 'leetcode_sync',
                topics: question.topics || []
            }));

            await progressCollection.insertMany(completionRecords);
        }

        const responseData = {
            success: true,
            message: questionsToMark.length > 0 
                ? `Successfully synced ${questionsToMark.length} problems as completed`
                : `All ${availableQuestions.length} matching problems were already marked as completed`,
            markedCount: questionsToMark.length,
            totalSolved: result.totalSolved,
            foundSpecific: result.problemIds.length,
            availableInDatabase: availableQuestions.length,
            alreadyCompleted: alreadyCompleted.size,
            details: {
                newlyMarked: questionsToMark.length,
                previouslyCompleted: availableQuestions.length - questionsToMark.length,
                solvedButNotInDatabase: result.problemIds.length - availableQuestions.length,
                couldNotAccess: result.totalSolved - result.problemIds.length
            },
            note: result.problemIds.length < result.totalSolved 
                ? `We could only access ${result.problemIds.length} of your ${result.totalSolved} solved problems from recent submissions. Consider using bulk mark if you want to mark all questions as completed.`
                : undefined,
            canBulkMark: result.problemIds.length < result.totalSolved
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("Error in sync endpoint:", error);
        return NextResponse.json({ 
            error: "Failed to sync solved problems",
            details: error instanceof Error ? error.message : "Unknown error",
            suggestion: "Please try again later. If the problem persists, you can manually mark problems as completed."
        }, { status: 500 });
    }
}