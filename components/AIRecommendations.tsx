"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain,
    TrendingUp,
    Target,
    AlertTriangle,
    CheckCircle,
    Clock,
    RefreshCw,
    Lightbulb,
    BookOpen,
    BarChart3,
    Zap,
    Trophy,
    Flame
} from "lucide-react";

interface Recommendation {
    id: string;
    type: 'weakness' | 'consistency' | 'interview_prep' | 'advanced' | 'foundation';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionItems: string[];
    estimatedTime: string;
    reasoning: string;
    focusAreas?: string[];
}

interface TopicWeakness {
    topic: string;
    confidenceScore: number;
    problemsSolved: number;
    recommendedActions: string[];
    aiInsights?: string;
}

interface AIRecommendationsProps {
    userProfile: {
        handle: string;
        leetcodeUsername: string;
        displayName: string;
        onboarded: boolean;
    };
    leetcodeStats: {
        easy: number;
        medium: number;
        hard: number;
        total: number;
    };
}

const typeIcons = {
    'weakness': AlertTriangle,
    'consistency': Clock,
    'interview_prep': Target,
    'advanced': Trophy,
    'foundation': BookOpen
};

const typeColors = {
    'weakness': 'from-red-500/10 to-orange-500/10 border-red-500/20',
    'consistency': 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
    'interview_prep': 'from-purple-500/10 to-pink-500/10 border-purple-500/20',
    'advanced': 'from-yellow-500/10 to-orange-500/10 border-yellow-500/20',
    'foundation': 'from-green-500/10 to-emerald-500/10 border-green-500/20'
};

const priorityColors = {
    'high': 'bg-red-500/20 text-red-300 border-red-500/30',
    'medium': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'low': 'bg-green-500/20 text-green-300 border-green-500/30'
};

export default function AIRecommendations({ userProfile, leetcodeStats }: AIRecommendationsProps) {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [weaknesses, setWeaknesses] = useState<TopicWeakness[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchRecommendations = async () => {
        try {
            setError(null);
            const response = await fetch('/api/ai/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userProfile,
                    leetcodeStats
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch recommendations: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            setRecommendations(data.recommendations || []);
            setWeaknesses(data.weaknesses || []);
            setLastUpdated(data.generatedAt || new Date().toISOString());

        } catch (error) {
            console.error("Failed to fetch AI recommendations:", error);
            setError(error instanceof Error ? error.message : "Failed to generate recommendations");
            
            // Show fallback message
            setRecommendations([]);
            setWeaknesses([]);
        } finally {
            setLoading(false);
        }
    };

    const refreshRecommendations = async () => {
        setRefreshing(true);
        try {
            setError(null);
            const response = await fetch('/api/ai/recommendations/refresh', {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error(`Refresh failed: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.data) {
                setRecommendations(data.data.recommendations || []);
                setWeaknesses(data.data.weaknesses || []);
                setLastUpdated(data.refreshedAt);
            } else {
                throw new Error(data.error || "Refresh failed");
            }

        } catch (error) {
            console.error("Failed to refresh recommendations:", error);
            setError("Failed to refresh recommendations. Please try again.");
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (userProfile.onboarded && leetcodeStats.total >= 0) {
            fetchRecommendations();
        } else {
            setLoading(false);
        }
    }, [userProfile, leetcodeStats]);

    const formatLastUpdate = (timestamp: string | null) => {
        if (!timestamp) return "Never updated";
        
        const diff = Date.now() - new Date(timestamp).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        
        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hours ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    if (!userProfile.onboarded) {
        return (
            <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-8 text-center">
                    <Brain className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Complete Your Profile</h3>
                    <p className="text-slate-400">
                        Please complete your profile setup to receive personalized AI recommendations.
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
                    <p className="text-slate-400">Generating personalized recommendations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Stats and Refresh Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center">
                        <Brain className="w-6 h-6 mr-2 text-purple-400" />
                        AI Insights & Recommendations
                    </h2>
                    <p className="text-slate-400 mt-1">
                        Personalized guidance based on your LeetCode progress • Powered by Gemini AI
                    </p>
                </div>
                
                <div className="flex items-center space-x-3">
                    <div className="text-right text-sm text-slate-400">
                        <p>Last updated: {formatLastUpdate(lastUpdated)}</p>
                        <p>{leetcodeStats.total} problems analyzed</p>
                    </div>
                    <Button
                        onClick={refreshRecommendations}
                        disabled={refreshing}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                        {refreshing ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4 mr-2" />
                                Refresh AI Analysis
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <Card className="bg-red-500/10 border-red-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            <p className="text-red-300">{error}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">{leetcodeStats.total}</div>
                        <div className="text-xs text-green-300">Total Solved</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-400">{recommendations.length}</div>
                        <div className="text-xs text-blue-300">AI Recommendations</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">{weaknesses.length}</div>
                        <div className="text-xs text-purple-300">Focus Areas</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                            {Math.round((leetcodeStats.total / 300) * 100)}%
                        </div>
                        <div className="text-xs text-yellow-300">Interview Ready</div>
                    </CardContent>
                </Card>
            </div>

            {/* AI Recommendations */}
            {recommendations.length > 0 && (
                <div>
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                        Personalized Recommendations
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AnimatePresence>
                            {recommendations.map((rec, index) => {
                                const IconComponent = typeIcons[rec.type] || Target;
                                return (
                                    <motion.div
                                        key={rec.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className={`bg-gradient-to-r ${typeColors[rec.type]} backdrop-blur-sm hover:scale-105 transition-transform duration-200`}>
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="p-2 bg-white/10 rounded-lg">
                                                            <IconComponent className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-lg text-white">{rec.title}</CardTitle>
                                                            <div className="flex items-center space-x-2 mt-1">
                                                                <Badge className={`text-xs ${priorityColors[rec.priority]}`}>
                                                                    {rec.priority} priority
                                                                </Badge>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {rec.estimatedTime}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-white/80 text-sm mb-4">{rec.description}</p>
                                                
                                                <div className="space-y-3">
                                                    <div>
                                                        <h4 className="text-white font-medium text-sm mb-2">Action Items:</h4>
                                                        <ul className="space-y-1">
                                                            {rec.actionItems.map((item, idx) => (
                                                                <li key={idx} className="flex items-start space-x-2 text-sm text-white/70">
                                                                    <CheckCircle className="w-3 h-3 mt-0.5 text-green-400 flex-shrink-0" />
                                                                    <span>{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    
                                                    {rec.focusAreas && rec.focusAreas.length > 0 && (
                                                        <div>
                                                            <h4 className="text-white font-medium text-sm mb-2">Focus Areas:</h4>
                                                            <div className="flex flex-wrap gap-1">
                                                                {rec.focusAreas.map((area, idx) => (
                                                                    <Badge key={idx} variant="secondary" className="text-xs">
                                                                        {area}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="pt-2 border-t border-white/10">
                                                        <p className="text-xs text-white/60 italic">
                                                            💡 {rec.reasoning}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Weakness Analysis */}
            {weaknesses.length > 0 && (
                <div>
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-red-400" />
                        Weakness Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {weaknesses.map((weakness, index) => (
                            <motion.div
                                key={weakness.topic}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="bg-slate-800/50 border-slate-700/50 hover:border-red-500/50 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-semibold text-white">{weakness.topic}</h4>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-red-400">
                                                    {Math.round(weakness.confidenceScore * 100)}%
                                                </div>
                                                <div className="text-xs text-slate-400">Confidence</div>
                                            </div>
                                        </div>
                                        
                                        {/* Confidence Bar */}
                                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${
                                                    weakness.confidenceScore > 0.7 ? 'bg-green-500' :
                                                    weakness.confidenceScore > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                                style={{ width: `${weakness.confidenceScore * 100}%` }}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="text-sm text-slate-300">
                                                <span className="text-blue-400">{weakness.problemsSolved}</span> problems estimated
                                            </div>
                                            
                                            {weakness.aiInsights && (
                                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                                    <p className="text-sm text-blue-200">
                                                        🤖 {weakness.aiInsights}
                                                    </p>
                                                </div>
                                            )}
                                            
                                            <div>
                                                <h5 className="text-sm font-medium text-white mb-2">Recommended Actions:</h5>
                                                <ul className="space-y-1">
                                                    {weakness.recommendedActions.map((action, idx) => (
                                                        <li key={idx} className="flex items-start space-x-2 text-sm text-slate-300">
                                                            <TrendingUp className="w-3 h-3 mt-0.5 text-green-400 flex-shrink-0" />
                                                            <span>{action}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {recommendations.length === 0 && weaknesses.length === 0 && !error && (
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-8 text-center">
                        <Brain className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">No Recommendations Yet</h3>
                        <p className="text-slate-400 mb-4">
                            {leetcodeStats.total === 0 
                                ? "Start solving problems on LeetCode to receive personalized AI recommendations!"
                                : "Click 'Refresh AI Analysis' to generate recommendations based on your progress."
                            }
                        </p>
                        {leetcodeStats.total > 0 && (
                            <Button
                                onClick={refreshRecommendations}
                                disabled={refreshing}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                                <Zap className="w-4 h-4 mr-2" />
                                Generate AI Recommendations
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* AI Attribution */}
            <Card className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 border-purple-500/10">
                <CardContent className="p-4">
                    <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span>Powered by Google Gemini AI</span>
                        <span className="text-slate-600">•</span>
                        <span>Analysis based on your LeetCode statistics</span>
                        <span className="text-slate-600">•</span>
                        <span>Updated {formatLastUpdate(lastUpdated)}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}