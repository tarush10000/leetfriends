"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Sparkles, 
    Timer, 
    Send, 
    Crown, 
    Brain,
    Code,
    Clock,
    MessageCircle,
    Zap,
    Target,
    ChevronDown,
    ChevronUp
} from "lucide-react";

interface Challenge {
    _id: string;
    problemData: {
        title: string;
        difficulty: string;
        description: string;
        examples: Array<{
            input: string;
            output: string;
            explanation: string;
        }>;
        constraints: string[];
        hints: string[];
        timeLimit: number;
        topics: string[];
    };
    startTime: string;
    endTime: string;
    timerMinutes: number;
    status: string;
}

interface GameMasterProps {
    partyCode: string;
    isOwner: boolean;
}

export default function GameMaster({ partyCode, isOwner }: GameMasterProps) {
    const [activeTab, setActiveTab] = useState<'challenge' | 'ask'>('challenge');
    const [loading, setLoading] = useState(false);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);
    
    // Challenge creation
    const [difficulty, setDifficulty] = useState('Medium');
    const [topic, setTopic] = useState('');
    const [timerMinutes, setTimerMinutes] = useState(30);
    
    // Ask Game Master
    const [query, setQuery] = useState('');
    const [gmResponse, setGmResponse] = useState('');
    const [chatHistory, setChatHistory] = useState<Array<{
        type: 'user' | 'gm';
        message: string;
        timestamp: string;
    }>>([]);

    useEffect(() => {
        fetchActiveChallenges();
    }, [partyCode]);

    const fetchActiveChallenges = async () => {
        try {
            const response = await fetch(`/api/game-master?partyCode=${partyCode}`);
            if (response.ok) {
                const data = await response.json();
                setChallenges(data.challenges || []);
            }
        } catch (error) {
            console.error("Error fetching challenges:", error);
        }
    };

    const createChallenge = async () => {
        if (!isOwner) {
            toast.error("Only party owners can create challenges");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/game-master", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "suggest_problem",
                    partyCode,
                    difficulty,
                    topic: topic || undefined,
                    timerMinutes
                }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                await fetchActiveChallenges();
                setTopic('');
            } else {
                toast.error(data.error || "Failed to create challenge");
            }
        } catch (error) {
            toast.error("Error creating challenge");
        } finally {
            setLoading(false);
        }
    };

    const askGameMaster = async () => {
        if (!query.trim()) return;

        setLoading(true);
        const userMessage = query.trim();
        setQuery('');

        // Add user message to chat
        const newUserMessage = {
            type: 'user' as const,
            message: userMessage,
            timestamp: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, newUserMessage]);

        try {
            const response = await fetch("/api/game-master", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "ask_gm",
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
                setGmResponse(data.response);
            } else {
                toast.error(data.error || "Game Master is unavailable");
            }
        } catch (error) {
            toast.error("Error contacting Game Master");
        } finally {
            setLoading(false);
        }
    };

    const formatTimeRemaining = (endTime: string) => {
        const remaining = new Date(endTime).getTime() - new Date().getTime();
        if (remaining <= 0) return "Time's up!";
        
        const minutes = Math.floor(remaining / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="p-6">
            {/* Tab Navigation */}
            <div className="flex rounded-lg bg-slate-800/50 p-1 mb-6">
                <Button
                    variant={activeTab === 'challenge' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('challenge')}
                    className={`flex-1 ${
                        activeTab === 'challenge' 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <Target className="w-4 h-4 mr-2" />
                    Challenges
                </Button>
                <Button
                    variant={activeTab === 'ask' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('ask')}
                    className={`flex-1 ${
                        activeTab === 'ask' 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <Brain className="w-4 h-4 mr-2" />
                    Ask GM
                </Button>

                <AnimatePresence mode="wait">
                    {activeTab === 'challenge' && (
                        <motion.div
                            key="challenge"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            {/* Create Challenge (Owner Only) */}
                            {isOwner && (
                                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 mb-6">
                                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                        <Code className="w-5 h-5 mr-2" />
                                        Create New Challenge
                                        <Crown className="w-4 h-4 ml-2 text-yellow-500" />
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <Label className="text-slate-300">Difficulty</Label>
                                            <select
                                                value={difficulty}
                                                onChange={(e) => setDifficulty(e.target.value)}
                                                className="w-full p-2 bg-slate-900/50 border border-slate-600 rounded text-white"
                                            >
                                                <option value="Easy">Easy</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Hard">Hard</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <Label className="text-slate-300">Topic (Optional)</Label>
                                            <Input
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                placeholder="e.g., Arrays, Trees, DP"
                                                className="bg-slate-900/50 border-slate-600 text-white"
                                            />
                                        </div>
                                        
                                        <div>
                                            <Label className="text-slate-300">Timer (minutes)</Label>
                                            <Input
                                                type="number"
                                                value={timerMinutes}
                                                onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 30)}
                                                min="5"
                                                max="120"
                                                className="bg-slate-900/50 border-slate-600 text-white"
                                            />
                                        </div>
                                    </div>
                                    
                                    <Button
                                        onClick={createChallenge}
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                    >
                                        {loading ? (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                                Game Master is thinking...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-4 h-4 mr-2" />
                                                Generate Challenge
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {/* Active Challenges */}
                            <div>
                                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Timer className="w-5 h-5 mr-2" />
                                    Active Challenges
                                </h4>
                                
                                {challenges.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No active challenges</p>
                                        {isOwner && <p className="text-sm">Create one to get started!</p>}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {challenges.map((challenge) => (
                                            <div
                                                key={challenge._id}
                                                className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <h5 className="font-semibold text-white">
                                                        {challenge.problemData.title}
                                                    </h5>
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                            challenge.problemData.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                                                            challenge.problemData.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-red-500/20 text-red-400'
                                                        }`}>
                                                            {challenge.problemData.difficulty}
                                                        </span>
                                                        <div className="flex items-center text-slate-400 text-sm">
                                                            <Clock className="w-4 h-4 mr-1" />
                                                            {formatTimeRemaining(challenge.endTime)}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {challenge.problemData.topics.map((topic, idx) => (
                                                        <span 
                                                            key={idx}
                                                            className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs"
                                                        >
                                                            {topic}
                                                        </span>
                                                    ))}
                                                </div>
                                                
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setExpandedChallenge(
                                                        expandedChallenge === challenge._id ? null : challenge._id
                                                    )}
                                                    className="text-slate-300 border-slate-600"
                                                >
                                                    {expandedChallenge === challenge._id ? (
                                                        <>
                                                            <ChevronUp className="w-4 h-4 mr-1" />
                                                            Hide Details
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="w-4 h-4 mr-1" />
                                                            View Problem
                                                        </>
                                                    )}
                                                </Button>

                                                <AnimatePresence>
                                                    {expandedChallenge === challenge._id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="mt-4 p-4 bg-slate-900/50 rounded border border-slate-700/30"
                                                        >
                                                            <div className="prose prose-invert max-w-none">
                                                                <p className="text-slate-300 whitespace-pre-line">
                                                                    {challenge.problemData.description}
                                                                </p>
                                                                
                                                                {challenge.problemData.examples.length > 0 && (
                                                                    <div className="mt-4">
                                                                        <h6 className="text-white font-medium mb-2">Examples:</h6>
                                                                        {challenge.problemData.examples.map((example, idx) => (
                                                                            <div key={idx} className="mb-3 p-2 bg-slate-800/50 rounded">
                                                                                <p className="text-sm"><strong>Input:</strong> {example.input}</p>
                                                                                <p className="text-sm"><strong>Output:</strong> {example.output}</p>
                                                                                {example.explanation && (
                                                                                    <p className="text-sm text-slate-400"><strong>Explanation:</strong> {example.explanation}</p>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                
                                                                {challenge.problemData.constraints.length > 0 && (
                                                                    <div className="mt-4">
                                                                        <h6 className="text-white font-medium mb-2">Constraints:</h6>
                                                                        <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                                                                            {challenge.problemData.constraints.map((constraint, idx) => (
                                                                                <li key={idx}>{constraint}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                                
                                                                {challenge.problemData.hints.length > 0 && (
                                                                    <div className="mt-4">
                                                                        <h6 className="text-white font-medium mb-2">Hints:</h6>
                                                                        <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                                                                            {challenge.problemData.hints.map((hint, idx) => (
                                                                                <li key={idx}>{hint}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))}
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
                            {/* Chat Interface */}
                            <div>
                                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <MessageCircle className="w-5 h-5 mr-2" />
                                    Ask the Game Master
                                </h4>
                                
                                {/* Chat History */}
                                <div className="h-48 overflow-y-auto bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 mb-4">
                                    {chatHistory.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-slate-400">
                                            <div className="text-center">
                                                <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <p>Ask me anything about coding, algorithms, or strategies!</p>
                                                <p className="text-sm mt-1">I'm here to help you improve.</p>
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
                                                    <div className={`max-w-[80%] p-3 rounded-lg ${
                                                        message.type === 'user'
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-slate-700 text-slate-200'
                                                    }`}>
                                                        <p className="text-sm whitespace-pre-line">{message.message}</p>
                                                        <p className="text-xs mt-1 opacity-70">
                                                            {new Date(message.timestamp).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Input */}
                                <div className="flex space-x-2">
                                    <Input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Ask about algorithms, debugging, strategies..."
                                        className="bg-slate-900/50 border-slate-600 text-white"
                                        onKeyPress={(e) => e.key === 'Enter' && !loading && askGameMaster()}
                                    />
                                    <Button
                                        onClick={askGameMaster}
                                        disabled={loading || !query.trim()}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
                                    <p className="text-sm text-slate-400 mb-2">Quick questions:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            "How do I optimize this algorithm?",
                                            "What's the best approach for dynamic programming?",
                                            "Help me debug my code",
                                            "Explain time complexity",
                                            "Binary search strategies"
                                        ].map((suggestion) => (
                                            <Button
                                                key={suggestion}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setQuery(suggestion)}
                                                className="text-xs text-slate-400 border-slate-600 hover:text-white"
                                            >
                                                {suggestion}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}