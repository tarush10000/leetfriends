// types/gamemaster.ts
export interface LeetCodeProblem {
    title: string;
    slug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    url: string;
    description: string;
    acceptance: string;
    tags: string[];
    questionId: number;
}

export interface Challenge {
    _id: string;
    partyCode: string;
    leetcodeProblem: LeetCodeProblem;
    createdBy: string;
    createdAt: Date;
    startTime: Date;
    endTime: Date;
    timerMinutes: number;
    status: 'active' | 'completed' | 'expired';
    submissions: ChallengeSubmission[];
}

export interface ChallengeSubmission {
    userEmail: string;
    userName: string;
    submittedAt: Date;
    status: 'completed' | 'attempted';
    verified: boolean;
    solutionUrl?: string; // Optional: link to their solution
    timeSpent?: number; // Optional: time in minutes
}

export interface GameMasterQuery {
    _id: string;
    partyCode: string;
    userEmail: string;
    query: string;
    response: string;
    timestamp: Date;
}

// Database Collections Schema:

// Collection: challenges
/*
{
  _id: ObjectId,
  partyCode: string,
  leetcodeProblem: {
    title: string,
    slug: string,
    difficulty: "Easy" | "Medium" | "Hard",
    url: string,
    description: string,
    acceptance: string, // "65.4%"
    tags: string[],
    questionId: number
  },
  createdBy: string, // user email
  createdAt: Date,
  startTime: Date,
  endTime: Date,
  timerMinutes: number,
  status: "active" | "completed" | "expired",
  submissions: [
    {
      userEmail: string,
      userName: string,
      submittedAt: Date,
      status: "completed" | "attempted",
      verified: boolean,
      solutionUrl?: string,
      timeSpent?: number
    }
  ]
}
*/

// Collection: gamemaster_queries (optional - for logging)
/*
{
  _id: ObjectId,
  partyCode: string,
  userEmail: string,
  query: string,
  response: string,
  timestamp: Date
}
*/

// utils/challenge-utils.ts
export function isChallengActive(challenge: Challenge): boolean {
    const now = new Date();
    return challenge.status === 'active' && new Date(challenge.endTime) > now;
}

export function getChallengeTimeRemaining(endTime: string | Date): {
    isExpired: boolean;
    timeLeft: string;
    minutes: number;
    seconds: number;
} {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const remaining = end - now;

    if (remaining <= 0) {
        return {
            isExpired: true,
            timeLeft: "Expired",
            minutes: 0,
            seconds: 0
        };
    }

    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return {
        isExpired: false,
        timeLeft: `${minutes}m ${seconds}s`,
        minutes,
        seconds
    };
}

export function getDifficultyColor(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
        case 'easy':
            return 'text-green-400 border-green-400/30 bg-green-400/10';
        case 'medium':
            return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
        case 'hard':
            return 'text-red-400 border-red-400/30 bg-red-400/10';
        default:
            return 'text-slate-400 border-slate-400/30 bg-slate-400/10';
    }
}

export function hasUserSubmitted(challenge: Challenge, userEmail: string): boolean {
    return challenge.submissions.some(sub => sub.userEmail === userEmail);
}

export function getChallengeLeaderboard(challenge: Challenge): ChallengeSubmission[] {
    return [...challenge.submissions]
        .filter(sub => sub.status === 'completed')
        .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
}