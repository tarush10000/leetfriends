import fetch from 'node-fetch';

export interface LeetCodeProblem {
    questionId: string;
    title: string;
    titleSlug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    isPaidOnly: boolean;
    categoryTitle: string;
    topicTags: Array<{
        name: string;
        slug: string;
    }>;
    stats: string;
}

export interface LeetCodeUserStats {
    easy: number;
    medium: number;
    hard: number;
    total: number;
}

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';
const LEETCODE_API_URL = 'https://leetcode.com/api/problems/all/';

export async function fetchLeetCodeProblems(): Promise<any[]> {
    try {
        const response = await fetch(LEETCODE_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as { stat_status_pairs?: any[] };
        return data.stat_status_pairs || [];
    } catch (error) {
        console.error('Error fetching LeetCode problems:', error);
        return [];
    }
}

export async function fetchUserStats(username: string): Promise<LeetCodeUserStats | null> {
    try {
        const query = `
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
    `;

        const response = await fetch(LEETCODE_GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; LeetFriends/1.0)',
            },
            body: JSON.stringify({
                query,
                variables: { username }
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as {
            data?: {
                matchedUser?: {
                    submitStats?: {
                        acSubmissionNum?: Array<{ difficulty: string; count: number }>;
                    };
                };
            };
        };

        if (!data.data?.matchedUser?.submitStats?.acSubmissionNum) {
            return null;
        }

        const stats = data.data.matchedUser.submitStats.acSubmissionNum;
        const easy = stats.find((s: any) => s.difficulty === 'Easy')?.count || 0;
        const medium = stats.find((s: any) => s.difficulty === 'Medium')?.count || 0;
        const hard = stats.find((s: any) => s.difficulty === 'Hard')?.count || 0;

        return {
            easy,
            medium,
            hard,
            total: easy + medium + hard,
        };
    } catch (error) {
        console.error(`Error fetching stats for ${username}:`, error);
        return null;
    }
}

export function getDifficultyLevel(difficulty: string): number {
    switch (difficulty.toLowerCase()) {
        case 'easy': return 1;
        case 'medium': return 2;
        case 'hard': return 3;
        default: return 2;
    }
}

export function formatDifficulty(level: number): string {
    switch (level) {
        case 1: return 'Easy';
        case 2: return 'Medium';
        case 3: return 'Hard';
        default: return 'Medium';
    }
}