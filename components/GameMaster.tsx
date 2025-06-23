import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    Brain,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    Crown,
    ExternalLink,
    MessageCircle,
    Send,
    Sparkles,
    Target,
    Trophy,
    Users,
    XCircle,
    Zap
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface Challenge {
    _id: string;
    leetcodeProblem: {
        title: string;
        slug: string;
        difficulty: string;
        url: string;
        description: string;
        acceptance: string;
        tags: string[];
        questionId: number;
    };
    startTime: string;
    endTime: string;
    timerMinutes: number;
    status: 'active' | 'completed' | 'expired';
    submissions: Array<{
        userEmail: string;
        userName: string;
        submittedAt: string;
        status: 'completed' | 'attempted';
        verified: boolean;
    }>;
}

interface GameMasterProps {
    partyCode: string;
    isOwner: boolean;
    currentUserEmail?: string;
    currentUserName?: string;
}

export default function GameMaster({ 
    partyCode, 
    isOwner, 
    currentUserEmail,
    currentUserName 
}: GameMasterProps) {
    const [activeTab, setActiveTab] = useState<'challenges' | 'ask'>('challenges');
    const [loading, setLoading] = useState(false);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);
    
    // Challenge creation
    const [difficulty, setDifficulty] = useState('Medium');
    const [topic, setTopic] = useState('');
    const [timerMinutes, setTimerMinutes] = useState(30);
    
    // Ask Game Master
    const [query, setQuery] = useState('');
    const [chatHistory, setChatHistory] = useState<Array<{
        type: 'user' | 'gm';
        message: string;
        timestamp: string;
    }>>([]);

    // Timer for real-time updates
    const [currentTime, setCurrentTime] = useState(Date.now());

    // Update current time every second for live countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Fetch challenges on mount and every 30 seconds
    useEffect(() => {
        fetchActiveChallenges();
        const interval = setInterval(fetchActiveChallenges, 30000);
        return () => clearInterval(interval);
    }, [partyCode]);

    const fetchActiveChallenges = useCallback(async () => {
        try {
            const response = await fetch(`/api/game-master/challenges?partyCode=${partyCode}`);
            if (response.ok) {
                const data = await response.json();
                setChallenges(data.challenges || []);
            } else {
                console.error("Failed to fetch challenges");
            }
        } catch (error) {
            console.error("Error fetching challenges:", error);
            setChallenges([]); // Set empty array on error
        }
    }, [partyCode]);

    const createChallenge = async () => {
        if (!isOwner) {
            toast.error("Only party owners can create challenges");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/game-master/create-challenge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    partyCode,
                    difficulty,
                    topic: topic.trim() || undefined,
                    timerMinutes
                }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(`🎯 ${difficulty} challenge created!`);
                await fetchActiveChallenges();
                setTopic('');
            } else {
                toast.error(data.error || "Failed to create challenge");
            }
        } catch (error) {
            toast.error("Error creating challenge");
            console.error("Create challenge error:", error);
        } finally {
            setLoading(false);
        }
    };

    const submitCompletion = async (challengeId: string) => {
        if (!currentUserEmail) {
            toast.error("Please sign in to submit");
            return;
        }

        try {
            const response = await fetch("/api/game-master/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    challengeId,
                    partyCode
                }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("🎉 Submission recorded!");
                await fetchActiveChallenges();
            } else {
                toast.error(data.error || "Failed to submit");
            }
        } catch (error) {
            toast.error("Error submitting completion");
            console.error("Submit error:", error);
        }
    };

    const askGameMaster = async () => {
        if (!query.trim()) return;

        setLoading(true);
        const userMessage = query.trim();
        setQuery('');

        const newUserMessage = {
            type: 'user' as const,
            message: userMessage,
            timestamp: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, newUserMessage]);

        try {
            const response = await fetch("/api/game-master/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    partyCode,
                    userQuery: userMessage
                }),
            });

            const data = await response.json();
            if (response.ok) {
                const gmMessage = {
                    type: 'gm' as const,
                    message: data.response,
                    timestamp: data.timestamp
                };
                setChatHistory(prev => [...prev, gmMessage]);
            } else {
                toast.error(data.error || "Game Master is unavailable");
            }
        } catch (error) {
            toast.error("Error contacting Game Master");
            console.error("Ask Game Master error:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatTimeRemaining = (endTime: string) => {
        const remaining = new Date(endTime).getTime() - currentTime;
        if (remaining <= 0) return { text: "Time's up!", color: "text-red-400", expired: true };
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        if (hours > 0) {
            return { text: `${hours}h ${minutes}m`, color: "text-blue-400", expired: false };
        } else if (minutes > 5) {
            return { text: `${minutes}m ${seconds}s`, color: "text-green-400", expired: false };
        } else if (minutes > 0) {
            return { text: `${minutes}m ${seconds}s`, color: "text-yellow-400", expired: false };
        } else {
            return { text: `${seconds}s`, color: "text-red-400", expired: false };
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return 'text-green-400 border-green-400/30 bg-green-400/10';
            case 'medium': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
            case 'hard': return 'text-red-400 border-red-400/30 bg-red-400/10';
            default: return 'text-slate-400 border-slate-400/30 bg-slate-400/10';
        }
    };

    const getUserSubmission = (challenge: Challenge) => {
        return challenge.submissions?.find(sub => sub.userEmail === currentUserEmail);
    };

    const getLeaderboard = (challenge: Challenge) => {
        return [...(challenge.submissions || [])]
            .filter(sub => sub.status === 'completed')
            .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
    };

    return (
        <div className="p-6 space-y-6">
            {/* Enhanced Tab Navigation */}
            <div className="flex rounded-xl bg-slate-800/50 p-1.5 backdrop-blur-sm border border-slate-700/50">
                <Button
                    variant={activeTab === 'challenges' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('challenges')}
                    className={`flex-1 rounded-lg transition-all duration-200 ${
                        activeTab === 'challenges' 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                >
                    <Target className="w-4 h-4 mr-2" />
                    Live Challenges
                    {challenges.length > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                            {challenges.length}
                        </span>
                    )}
                </Button>
                <Button
                    variant={activeTab === 'ask' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('ask')}
                    className={`flex-1 rounded-lg transition-all duration-200 ${
                        activeTab === 'ask' 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                >
                    <Brain className="w-4 h-4 mr-2" />
                    AI Assistant
                </Button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'challenges' && (
                    <motion.div
                        key="challenges"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        {/* Create Challenge (Owner Only) */}
                        {isOwner && (
                            <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-white flex items-center">
                                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                                            <Crown className="w-4 h-4 text-white" />
                                        </div>
                                        Create LeetCode Challenge
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <Label className="text-slate-300 text-sm">Difficulty</Label>
                                            <select
                                                value={difficulty}
                                                onChange={(e) => setDifficulty(e.target.value)}
                                                className="w-full p-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500/50"
                                            >
                                                <option value="Easy">Easy</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Hard">Hard</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <Label className="text-slate-300 text-sm">Topic (Optional)</Label>
                                            <Input
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                placeholder="e.g., Arrays, DP, Trees"
                                                className="bg-slate-800/50 border-slate-600/50 text-white text-sm"
                                            />
                                        </div>
                                        
                                        <div>
                                            <Label className="text-slate-300 text-sm">Timer (min)</Label>
                                            <Input
                                                type="number"
                                                value={timerMinutes}
                                                onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 30)}
                                                min="5"
                                                max="120"
                                                className="bg-slate-800/50 border-slate-600/50 text-white text-sm"
                                            />
                                        </div>
                                    </div>
                                    
                                    <Button
                                        onClick={createChallenge}
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2.5"
                                    >
                                        {loading ? (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                                Finding perfect problem...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-4 h-4 mr-2" />
                                                Create Challenge
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Active Challenges */}
                        <div>
                            {challenges.length === 0 ? (
                                <Card className="bg-slate-800/30 border-slate-700/50">
                                    <CardContent className="text-center py-12">
                                        <Target className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                                        <h3 className="text-xl font-semibold text-slate-300 mb-2">No active challenges</h3>
                                        <p className="text-slate-400 mb-6">
                                            {isOwner ? "Create the first challenge to get the competition started!" : "Waiting for the party owner to create a challenge..."}
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    {challenges.map((challenge) => {
                                        // Safety check for challenge structure
                                        if (!challenge || !challenge._id || !challenge.leetcodeProblem) {
                                            return null;
                                        }
                                        
                                        const userSubmission = getUserSubmission(challenge);
                                        const timeInfo = formatTimeRemaining(challenge.endTime);
                                        const leaderboard = getLeaderboard(challenge);
                                        
                                        return (
                                            <Card
                                                key={challenge._id}
                                                className={`bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-200 ${
                                                    timeInfo.expired ? 'opacity-75' : ''
                                                }`}
                                            >
                                                <CardContent className="p-6">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h3 className="text-lg font-semibold text-white">
                                                                    {challenge.leetcodeProblem?.title || 'Loading...'}
                                                                </h3>
                                                                <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getDifficultyColor(challenge.leetcodeProblem?.difficulty || 'Medium')}`}>
                                                                    {challenge.leetcodeProblem?.difficulty || 'Medium'}
                                                                </span>
                                                                <span className="text-slate-400 text-sm">
                                                                    {challenge.leetcodeProblem?.acceptance || '0%'} acceptance
                                                                </span>
                                                                {timeInfo.expired && (
                                                                    <span className="flex items-center text-red-400 text-xs">
                                                                        <AlertCircle className="w-3 h-3 mr-1" />
                                                                        Expired
                                                                    </span>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="flex flex-wrap gap-2 mb-3">
                                                                {(challenge.leetcodeProblem?.tags || []).map((tag, idx) => (
                                                                    <span 
                                                                        key={idx}
                                                                        className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs border border-blue-500/30"
                                                                    >
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="text-right">
                                                            <div className={`flex items-center text-sm font-medium ${timeInfo.color}`}>
                                                                <Clock className="w-4 h-4 mr-1" />
                                                                {timeInfo.text}
                                                            </div>
                                                            <div className="text-slate-400 text-xs mt-1">
                                                                {challenge.submissions.length} submission{challenge.submissions.length !== 1 ? 's' : ''}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <Button
                                                                asChild
                                                                variant="outline"
                                                                size="sm"
                                                                className="bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50"
                                                            >
                                                                <a 
                                                                    href={challenge.leetcodeProblem?.url || '#'} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center"
                                                                >
                                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                                    Solve on LeetCode
                                                                </a>
                                                            </Button>
                                                            
                                                            {userSubmission ? (
                                                                <div className="flex items-center text-green-400">
                                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                                    <span className="text-sm">Submitted!</span>
                                                                </div>
                                                            ) : timeInfo.expired ? (
                                                                <div className="flex items-center text-red-400">
                                                                    <XCircle className="w-4 h-4 mr-2" />
                                                                    <span className="text-sm">Time's up</span>
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    onClick={() => submitCompletion(challenge._id)}
                                                                    size="sm"
                                                                    className="bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30"
                                                                >
                                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                                    Mark Complete
                                                                </Button>
                                                            )}
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setExpandedChallenge(
                                                                expandedChallenge === challenge._id ? null : challenge._id
                                                            )}
                                                            className="text-slate-400 hover:text-white"
                                                        >
                                                            {expandedChallenge === challenge._id ? (
                                                                <>
                                                                    <ChevronUp className="w-4 h-4 mr-1" />
                                                                    Less
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ChevronDown className="w-4 h-4 mr-1" />
                                                                    Details
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>

                                                    <AnimatePresence>
                                                        {expandedChallenge === challenge._id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: "auto" }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="mt-4 pt-4 border-t border-slate-700/50"
                                                            >
                                                                <div className="prose prose-invert max-w-none">
                                                                    <p className="text-slate-300 text-sm leading-relaxed mb-4">
                                                                        {challenge.leetcodeProblem?.description || 'Click the link above to view the full problem statement on LeetCode.'}
                                                                    </p>
                                                                </div>
                                                                
                                                                {/* Leaderboard */}
                                                                {leaderboard.length > 0 && (
                                                                    <div className="mt-4">
                                                                        <h4 className="text-white font-medium mb-3 flex items-center">
                                                                            <Trophy className="w-4 h-4 mr-2 text-yellow-400" />
                                                                            Leaderboard ({leaderboard.length})
                                                                        </h4>
                                                                        <div className="space-y-2">
                                                                            {leaderboard.map((submission, idx) => (
                                                                                <div 
                                                                                    key={idx}
                                                                                    className={`flex items-center justify-between p-3 rounded-lg ${
                                                                                        idx === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                                                                                        idx === 1 ? 'bg-slate-600/30 border border-slate-500/30' :
                                                                                        idx === 2 ? 'bg-orange-500/10 border border-orange-500/30' :
                                                                                        'bg-slate-700/30'
                                                                                    }`}
                                                                                >
                                                                                    <div className="flex items-center">
                                                                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                                                                                            idx === 0 ? 'bg-yellow-500 text-black' :
                                                                                            idx === 1 ? 'bg-slate-400 text-white' :
                                                                                            idx === 2 ? 'bg-orange-500 text-white' :
                                                                                            'bg-slate-600 text-slate-300'
                                                                                        }`}>
                                                                                            {idx + 1}
                                                                                        </span>
                                                                                        <span className={`font-medium ${
                                                                                            submission.userEmail === currentUserEmail ? 'text-purple-400' : 'text-white'
                                                                                        }`}>
                                                                                            {submission.userName}
                                                                                            {submission.userEmail === currentUserEmail && (
                                                                                                <span className="text-purple-400 text-xs ml-1">(You)</span>
                                                                                            )}
                                                                                        </span>
                                                                                    </div>
                                                                                    <span className="text-slate-400 text-sm">
                                                                                        {new Date(submission.submittedAt).toLocaleTimeString()}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* All Submissions */}
                                                                {challenge.submissions.length > 0 && (
                                                                    <div className="mt-4">
                                                                        <h4 className="text-white font-medium mb-2 flex items-center">
                                                                            <Users className="w-4 h-4 mr-2" />
                                                                            All Submissions ({challenge.submissions.length})
                                                                        </h4>
                                                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                                                            {challenge.submissions.map((submission, idx) => (
                                                                                <div 
                                                                                    key={idx}
                                                                                    className="flex items-center justify-between p-2 bg-slate-700/30 rounded"
                                                                                >
                                                                                    <div className="flex items-center">
                                                                                        <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                                                                                        <span className={`text-sm ${
                                                                                            submission.userEmail === currentUserEmail ? 'text-purple-400 font-medium' : 'text-white'
                                                                                        }`}>
                                                                                            {submission.userName}
                                                                                        </span>
                                                                                    </div>
                                                                                    <span className="text-slate-400 text-xs">
                                                                                        {new Date(submission.submittedAt).toLocaleTimeString()}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'ask' && (
                    <motion.div
                        key="ask"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center">
                                    <MessageCircle className="w-5 h-5 mr-2" />
                                    AI Coding Assistant
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Chat History */}
                                <div className="h-64 overflow-y-auto bg-slate-900/50 rounded-lg border border-slate-700/50 p-4 mb-4">
                                    {chatHistory.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-slate-400">
                                            <div className="text-center">
                                                <Brain className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                                                <p className="font-medium">Ask me anything about coding!</p>
                                                <p className="text-sm mt-1">I can help with algorithms, debugging, optimization, and more.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {chatHistory.map((message, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[85%] p-4 rounded-xl ${
                                                        message.type === 'user'
                                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                                            : 'bg-slate-700/50 text-slate-200 border border-slate-600/50'
                                                    }`}>
                                                        <p className="text-sm whitespace-pre-line leading-relaxed">{message.message}</p>
                                                        <p className="text-xs mt-2 opacity-70">
                                                            {new Date(message.timestamp).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Input */}
                                <div className="flex space-x-3">
                                    <Input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Ask about algorithms, debugging, strategies..."
                                        className="bg-slate-900/50 border-slate-600/50 text-white placeholder:text-slate-500"
                                        onKeyPress={(e) => e.key === 'Enter' && !loading && askGameMaster()}
                                    />
                                    <Button
                                        onClick={askGameMaster}
                                        disabled={loading || !query.trim()}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4"
                                    >
                                        {loading ? (
                                            <Brain className="w-4 h-4 animate-pulse" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                                
                                {/* Quick Questions */}
                                <div className="mt-4">
                                    <p className="text-sm text-slate-400 mb-3">Quick questions:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            "How do I optimize this algorithm?",
                                            "Explain dynamic programming",
                                            "Binary search patterns",
                                            "Time complexity help",
                                            "Debugging strategies"
                                        ].map((suggestion) => (
                                            <Button
                                                key={suggestion}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setQuery(suggestion)}
                                                className="text-xs text-slate-400 border-slate-600/50 hover:text-white hover:border-purple-500/50 bg-slate-800/30"
                                            >
                                                {suggestion}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}