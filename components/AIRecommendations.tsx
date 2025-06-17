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
    Flame,
    ArrowRight,
    ChevronRight,
    Users,
    Code,
    Cpu,
    Calendar,
    Sparkles,
    Map,
    Play,
    ChevronDown,
    ExternalLink,
    TrendingDown,
    Activity,
    Award,
    Route,
    Circle,
    Timer,
    CheckSquare,
    Star,
    Info
} from "lucide-react";
import LearningPathComponent from './LearningPath';

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
    impact: number;
}

interface TopicAnalysis {
    topic: string;
    category: 'data_structures' | 'algorithms' | 'techniques' | 'advanced';
    currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    confidenceScore: number;
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

interface UserProfile {
    handle: string;
    leetcodeUsername: string;
    displayName: string;
    currentStats?: {
        easy: number;
        medium: number;
        hard: number;
        total: number;
    };
}

interface AIInsightsProps {
    userProfile: UserProfile;
    userEmail: string;
}

export default function CompleteEnhancedAIInsights({ userProfile, userEmail }: AIInsightsProps) {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [topicAnalysis, setTopicAnalysis] = useState<TopicAnalysis[]>([]);
    const [overallInsights, setOverallInsights] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [activeCard, setActiveCard] = useState<string | null>(null);
    const [activeTopicCard, setActiveTopicCard] = useState<string | null>(null);
    const [showTopicAnalysis, setShowTopicAnalysis] = useState(true);
    const [generatingPath, setGeneratingPath] = useState(false);
    const [activeTab, setActiveTab] = useState<'insights' | 'learning-path'>('insights');
    const [refreshCounter, setRefreshCounter] = useState(0);

    useEffect(() => {
        loadEnhancedInsights();
    }, [userProfile]);

    const loadEnhancedInsights = async () => {
        if (!userProfile?.currentStats) return;

        setLoading(true);
        try {
            const response = await fetch('/api/ai/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userProfile,
                    leetcodeStats: userProfile.currentStats
                })
            });

            if (response.ok) {
                const data = await response.json();
                setRecommendations(data.recommendations || []);
                setTopicAnalysis(data.topicAnalysis || []);
                setOverallInsights(data.overallInsights || null);
                setLastUpdated(new Date());
            } else {
                setRecommendations(getFallbackRecommendations());
                setTopicAnalysis(getFallbackTopicAnalysis());
            }
        } catch (error) {
            console.error('Failed to load enhanced insights:', error);
            setRecommendations(getFallbackRecommendations());
            setTopicAnalysis(getFallbackTopicAnalysis());
        } finally {
            setLoading(false);
        }
    };

    const generateLearningPath = async () => {
        setGeneratingPath(true);
        try {
            const weakTopics = topicAnalysis
                .filter(t => t.confidenceScore < 65 || t.priorityLevel === 'high')
                .sort((a, b) => a.confidenceScore - b.confidenceScore)
                .map(t => t.topic);

            const uniqueTopics = [...new Set(weakTopics)];
            const focusTopics = uniqueTopics.slice(0, 6); // limit to top 6 weaknesses for focus

            const response = await fetch('/api/learning-path/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userProfile,
                    leetcodeStats: userProfile.currentStats,
                    preferences: {
                        timeAvailable: '1-2 hours',
                        dailyProblems: 2,
                        focusAreas: focusTopics,
                        duration: overallInsights?.timeToInterviewReady === 'Ready now!' ? 30 : 45
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const acceptResponse = await fetch('/api/learning-path/accept', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ learningPathId: data.learningPath.id })
                });

                if (acceptResponse.ok) {
                    setRefreshCounter(prev => prev + 1);
                    setActiveTab('learning-path');
                    alert('Learning path generated and started! Check your daily tasks.');
                } else {
                    alert('Learning path generated! Please accept it to start.');
                }
            } else {
                throw new Error('Failed to generate learning path');
            }
        } catch (error) {
            console.error('Failed to generate learning path:', error);
            alert('Failed to generate learning path. Please try again.');
        } finally {
            setGeneratingPath(false);
        }
    };

    const refreshInsights = async () => {
        setRefreshing(true);
        await loadEnhancedInsights();
        setRefreshing(false);
    };

    const getWeakTopics = () => {
        return topicAnalysis.filter(topic =>
            topic.confidenceScore < 60 || topic.priorityLevel === 'high'
        );
    };

    const getStrongTopics = () => {
        return topicAnalysis.filter(topic =>
            topic.confidenceScore >= 70 && topic.currentLevel !== 'beginner'
        );
    };

    const formatLastUpdate = (date: Date | null) => {
        if (!date) return 'Never';
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="relative">
                        <Brain className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-pulse" />
                        <Sparkles className="w-6 h-6 text-pink-400 absolute -top-1 -right-1 animate-bounce" />
                    </div>
                    <p className="text-white font-medium">Analyzing your progress...</p>
                    <p className="text-slate-400 text-sm mt-1">AI is generating personalized insights</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex items-center space-x-1 bg-slate-800/50 p-1 rounded-lg w-fit">
                <Button
                    variant={activeTab === 'insights' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('insights')}
                    className={activeTab === 'insights' ? 'bg-purple-600' : 'text-slate-400 hover:text-white'}
                >
                    <Brain className="w-4 h-4 mr-2" />
                    AI Insights
                </Button>
                <Button
                    variant={activeTab === 'learning-path' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('learning-path')}
                    className={activeTab === 'learning-path' ? 'bg-purple-600' : 'text-slate-400 hover:text-white'}
                >
                    <Route className="w-4 h-4 mr-2" />
                    Learning Path
                </Button>
            </div>

            {activeTab === 'insights' ? (
                <div className="space-y-8">
                    {/* Header with Actions */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg">
                                    <Brain className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">AI-Powered Analysis</h2>
                                    <p className="text-slate-400">Comprehensive insights and personalized learning path</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="text-right text-sm">
                                <p className="text-slate-400">Last updated: {formatLastUpdate(lastUpdated)}</p>
                                <p className="text-slate-500">{userProfile.currentStats?.total || 0} problems analyzed</p>
                            </div>
                            <Button
                                onClick={generateLearningPath}
                                disabled={generatingPath}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            >
                                {generatingPath ? (
                                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Route className="w-4 h-4 mr-2" />
                                )}
                                {generatingPath ? 'Generating...' : 'Create Learning Path'}
                            </Button>
                            <Button
                                onClick={refreshInsights}
                                disabled={refreshing}
                                size="sm"
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                                {refreshing ? (
                                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Zap className="w-4 h-4 mr-2" />
                                )}
                                {refreshing ? 'Updating...' : 'Refresh'}
                            </Button>
                        </div>
                    </div>

                    {/* Overall Insights Cards */}
                    {overallInsights && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-500/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-300 text-sm font-medium">Skill Level</p>
                                            <p className="text-lg font-bold text-white capitalize">{overallInsights.userLevel}</p>
                                        </div>
                                        <Activity className="w-6 h-6 text-blue-400" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-500/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-green-300 text-sm font-medium">Interview Ready</p>
                                            <p className="text-lg font-bold text-white">{overallInsights.interviewReadiness}%</p>
                                        </div>
                                        <Trophy className="w-6 h-6 text-green-400" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-500/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-purple-300 text-sm font-medium">Next Goal</p>
                                            <p className="text-lg font-bold text-white">{overallInsights.nextMilestone?.target}</p>
                                        </div>
                                        <Target className="w-6 h-6 text-purple-400" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-orange-900/20 to-orange-800/20 border-orange-500/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-orange-300 text-sm font-medium">Time to Ready</p>
                                            <p className="text-sm font-bold text-white">{overallInsights.timeToInterviewReady}</p>
                                        </div>
                                        <Clock className="w-6 h-6 text-orange-400" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Topic Analysis Section */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2">
                                <BarChart3 className="w-5 h-5 text-blue-400" />
                                <h3 className="text-xl font-semibold text-white">Topic-wise Analysis</h3>
                                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                    {topicAnalysis.length} topics analyzed
                                </Badge>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowTopicAnalysis(!showTopicAnalysis)}
                                className="text-slate-400 hover:text-white"
                            >
                                <ChevronDown className={`w-4 h-4 transition-transform ${showTopicAnalysis ? 'rotate-180' : ''}`} />
                            </Button>
                        </div>

                        <AnimatePresence>
                            {showTopicAnalysis && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-4"
                                >
                                    {/* Weak Areas */}
                                    {getWeakTopics().length > 0 && (
                                        <div>
                                            <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                                                <TrendingDown className="w-5 h-5 text-red-400 mr-2" />
                                                Areas for Improvement ({getWeakTopics().length})
                                            </h4>
                                            <div className="grid gap-3">
                                                {getWeakTopics().map((topic, index) => (
                                                    <TopicCard
                                                        key={topic.topic}
                                                        topic={topic}
                                                        index={index}
                                                        isActive={activeTopicCard === topic.topic}
                                                        onClick={() => setActiveTopicCard(activeTopicCard === topic.topic ? null : topic.topic)}
                                                        variant="weak"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Strong Areas */}
                                    {getStrongTopics().length > 0 && (
                                        <div>
                                            <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                                                <TrendingUp className="w-5 h-5 text-green-400 mr-2" />
                                                Strengths ({getStrongTopics().length})
                                            </h4>
                                            <div className="grid gap-3">
                                                {getStrongTopics().map((topic, index) => (
                                                    <TopicCard
                                                        key={topic.topic}
                                                        topic={topic}
                                                        index={index}
                                                        isActive={activeTopicCard === topic.topic}
                                                        onClick={() => setActiveTopicCard(activeTopicCard === topic.topic ? null : topic.topic)}
                                                        variant="strong"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* AI Recommendations */}
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <Lightbulb className="w-5 h-5 text-yellow-400" />
                            <h3 className="text-xl font-semibold text-white">Smart Recommendations</h3>
                            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                {recommendations.length} insights
                            </Badge>
                        </div>

                        <div className="grid gap-4">
                            <AnimatePresence>
                                {recommendations.map((rec, index) => (
                                    <RecommendationCard
                                        key={rec.id}
                                        recommendation={rec}
                                        index={index}
                                        isActive={activeCard === rec.id}
                                        onClick={() => setActiveCard(activeCard === rec.id ? null : rec.id)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Empty States */}
                    {recommendations.length === 0 && topicAnalysis.length === 0 && (
                        <Card className="bg-slate-800/50 border-slate-700/50">
                            <CardContent className="p-8 text-center">
                                <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-white mb-2">No Analysis Available</h3>
                                <p className="text-slate-400 mb-4">
                                    Start solving problems to get comprehensive AI insights and topic analysis!
                                </p>
                                <Button
                                    onClick={refreshInsights}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                >
                                    Generate Insights
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            ) : (
                <LearningPathComponent userEmail={userEmail} refreshSignal={refreshCounter} />
            )}
        </div>
    );
}

// Topic Card Component
function TopicCard({
    topic,
    index,
    isActive,
    onClick,
    variant
}: {
    topic: TopicAnalysis;
    index: number;
    isActive: boolean;
    onClick: () => void;
    variant: 'weak' | 'strong';
}) {
    const getLevelColor = (level: string) => {
        switch (level) {
            case 'beginner': return 'text-red-400 bg-red-500/10 border-red-500/30';
            case 'intermediate': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            case 'advanced': return 'text-green-400 bg-green-500/10 border-green-500/30';
            case 'expert': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
        }
    };

    const getConfidenceColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        if (score >= 40) return 'text-orange-400';
        return 'text-red-400';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card
                className={`bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-200 cursor-pointer ${isActive ? 'ring-2 ring-blue-500/50' : ''
                    } ${variant === 'weak' ? 'border-red-500/20' : 'border-green-500/20'}`}
                onClick={onClick}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${variant === 'weak' ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                                {variant === 'weak' ? <TrendingDown className="w-5 h-5 text-red-400" /> : <TrendingUp className="w-5 h-5 text-green-400" />}
                            </div>
                            <div>
                                <CardTitle className="text-white text-lg">{topic.topic}</CardTitle>
                                <div className="flex items-center space-x-2 mt-1">
                                    <Badge className={getLevelColor(topic.currentLevel)}>
                                        {topic.currentLevel}
                                    </Badge>
                                    <span className={`text-sm font-medium ${getConfidenceColor(topic.confidenceScore)}`}>
                                        {topic.confidenceScore}% confidence
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Badge className={topic.priorityLevel === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                topic.priorityLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                                    'bg-green-500/20 text-green-300 border-green-500/30'}>
                                {topic.priorityLevel} priority
                            </Badge>
                            <ChevronRight
                                className={`w-4 h-4 text-slate-400 transition-transform ${isActive ? 'rotate-90' : ''
                                    }`}
                            />
                        </div>
                    </div>
                </CardHeader>

                <AnimatePresence>
                    {isActive && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CardContent className="pt-0 space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-400">Problems Solved:</span>
                                        <span className="text-white ml-2 font-medium">{topic.problemsSolved}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Recommended:</span>
                                        <span className="text-white ml-2 font-medium">{topic.recommendedProblems}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-slate-400">Time to improve:</span>
                                        <span className="text-white ml-2 font-medium">{topic.estimatedTimeToImprove}</span>
                                    </div>
                                </div>

                                {topic.strengths.length > 0 && (
                                    <div>
                                        <h5 className="text-white font-medium text-sm mb-2 flex items-center">
                                            <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                                            Strengths
                                        </h5>
                                        <div className="flex flex-wrap gap-1">
                                            {topic.strengths.map((strength, idx) => (
                                                <Badge key={idx} variant="secondary" className="text-xs bg-green-500/20 text-green-300 border-green-500/30">
                                                    {strength}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {topic.weaknesses.length > 0 && (
                                    <div>
                                        <h5 className="text-white font-medium text-sm mb-2 flex items-center">
                                            <AlertTriangle className="w-4 h-4 mr-2 text-red-400" />
                                            Areas to Improve
                                        </h5>
                                        <div className="flex flex-wrap gap-1">
                                            {topic.weaknesses.map((weakness, idx) => (
                                                <Badge key={idx} variant="secondary" className="text-xs bg-red-500/20 text-red-300 border-red-500/30">
                                                    {weakness}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {topic.keyPatterns.length > 0 && (
                                    <div>
                                        <h5 className="text-white font-medium text-sm mb-2 flex items-center">
                                            <Code className="w-4 h-4 mr-2 text-blue-400" />
                                            Key Patterns
                                        </h5>
                                        <div className="flex flex-wrap gap-1">
                                            {topic.keyPatterns.map((pattern, idx) => (
                                                <Badge key={idx} variant="secondary" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
                                                    {pattern}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h5 className="text-white font-medium text-sm mb-2 flex items-center">
                                        <ArrowRight className="w-4 h-4 mr-2 text-purple-400" />
                                        Next Steps
                                    </h5>
                                    <ul className="space-y-1">
                                        {topic.nextSteps.map((step, idx) => (
                                            <li key={idx} className="flex items-start text-slate-300 text-sm">
                                                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                <span>{step}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </motion.div>
    );
}

// Recommendation Card Component
function RecommendationCard({
    recommendation,
    index,
    isActive,
    onClick
}: {
    recommendation: Recommendation;
    index: number;
    isActive: boolean;
    onClick: () => void;
}) {
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'weakness': return <Target className="w-5 h-5" />;
            case 'consistency': return <Calendar className="w-5 h-5" />;
            case 'interview_prep': return <Users className="w-5 h-5" />;
            case 'advanced': return <Cpu className="w-5 h-5" />;
            case 'foundation': return <BookOpen className="w-5 h-5" />;
            case 'optimization': return <Zap className="w-5 h-5" />;
            default: return <Lightbulb className="w-5 h-5" />;
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'high': return <AlertTriangle className="w-4 h-4 text-red-400" />;
            case 'medium': return <Info className="w-4 h-4 text-yellow-400" />;
            case 'low': return <CheckCircle className="w-4 h-4 text-green-400" />;
            default: return <Circle className="w-4 h-4 text-gray-400" />;
        }
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card
                className={`bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-200 cursor-pointer ${isActive ? 'ring-2 ring-purple-500/50' : ''
                    }`}
                onClick={onClick}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                                {getTypeIcon(recommendation.type)}
                            </div>
                            <div>
                                <CardTitle className="text-white text-lg">{recommendation.title}</CardTitle>
                                <div className="flex items-center space-x-2 mt-1">
                                    <Badge
                                        className={
                                            recommendation.difficulty === 'easy'
                                                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                                : recommendation.difficulty === 'medium'
                                                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                                    : recommendation.difficulty === 'hard'
                                                        ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                                        : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                        }
                                    >
                                        {recommendation.difficulty}
                                    </Badge>
                                    <span className="text-xs text-slate-400">
                                        {recommendation.estimatedTime} to complete
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Badge
                                className={
                                    recommendation.priority === 'high'
                                        ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                        : recommendation.priority === 'medium'
                                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                            : 'bg-green-500/20 text-green-300 border-green-500/30'
                                }
                            >
                                {recommendation.priority} priority
                            </Badge>
                            {getPriorityIcon(recommendation.priority)}
                            <ChevronRight
                                className={`w-4 h-4 text-slate-400 transition-transform ${isActive ? 'rotate-90' : ''
                                    }`}
                            />
                        </div>
                    </div>
                </CardHeader>
                <AnimatePresence>
                    {isActive && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CardContent className="pt-0 space-y-4">
                                <div>
                                    <p className="text-slate-300 mb-2">{recommendation.description}</p>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {recommendation.focusAreas.map((area, idx) => (
                                            <Badge
                                                key={idx}
                                                variant="secondary"
                                                className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30"
                                            >
                                                {area}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h5 className="text-white font-medium text-sm mb-2 flex items-center">
                                        <ArrowRight className="w-4 h-4 mr-2 text-purple-400" />
                                        Action Items
                                    </h5>
                                    <ul className="space-y-1">
                                        {recommendation.actionItems.map((item, idx) => (
                                            <li key={idx} className="flex items-start text-slate-300 text-sm">
                                                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h5 className="text-white font-medium text-sm mb-2 flex items-center">
                                        <Lightbulb className="w-4 h-4 mr-2 text-yellow-400" />
                                        Reasoning
                                    </h5>
                                    <p className="text-slate-400 text-sm">{recommendation.reasoning}</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Timer className="w-4 h-4 text-orange-400" />
                                    <span className="text-slate-400 text-xs">
                                        Estimated time: <span className="text-white font-medium">{recommendation.estimatedTime}</span>
                                    </span>
                                    <Star className="w-4 h-4 text-pink-400" />
                                    <span className="text-slate-400 text-xs">
                                        Impact: <span className="text-white font-medium">{recommendation.impact}</span>
                                    </span>
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </motion.div>
    );
}

// Fallbacks for offline/demo mode
function getFallbackRecommendations(): Recommendation[] {
    return [
        {
            id: "1",
            type: "weakness",
            title: "Focus on Dynamic Programming",
            description: "Dynamic Programming is a key area for interviews. Strengthen your fundamentals and practice more problems.",
            priority: "high",
            actionItems: [
                "Review DP patterns (knapsack, LIS, etc.)",
                "Solve 5 new DP problems this week",
                "Summarize mistakes after each attempt"
            ],
            estimatedTime: "5-7 days",
            reasoning: "Your accuracy and confidence in DP is below 50%. Improving this will boost your interview readiness.",
            focusAreas: ["Dynamic Programming", "Patterns", "Optimization"],
            difficulty: "hard",
            impact: 9
        },
        {
            id: "2",
            type: "consistency",
            title: "Increase Daily Practice",
            description: "Consistent daily practice leads to better retention and confidence.",
            priority: "medium",
            actionItems: [
                "Set a daily reminder for LeetCode",
                "Aim for 2 problems per day",
                "Track your streak for motivation"
            ],
            estimatedTime: "2 weeks",
            reasoning: "Your practice frequency dropped last week. Consistency is key for long-term improvement.",
            focusAreas: ["Consistency", "Habits"],
            difficulty: "easy",
            impact: 7
        }
    ];
}

function getFallbackTopicAnalysis(): TopicAnalysis[] {
    return [
        {
            topic: "Dynamic Programming",
            category: "algorithms",
            currentLevel: "beginner",
            confidenceScore: 45,
            problemsSolved: 7,
            recommendedProblems: 15,
            strengths: [],
            weaknesses: ["Identifying subproblems", "Memoization"],
            nextSteps: [
                "Review basic DP concepts",
                "Practice easy DP problems",
                "Watch a DP patterns video"
            ],
            priorityLevel: "high",
            estimatedTimeToImprove: "1-2 weeks",
            keyPatterns: ["Knapsack", "LIS"],
            commonMistakes: ["Overlapping subproblems", "State definition"]
        },
        {
            topic: "Arrays",
            category: "data_structures",
            currentLevel: "advanced",
            confidenceScore: 85,
            problemsSolved: 40,
            recommendedProblems: 5,
            strengths: ["Sliding window", "Prefix sums"],
            weaknesses: [],
            nextSteps: [
                "Try some advanced array problems",
                "Explore array optimizations"
            ],
            priorityLevel: "low",
            estimatedTimeToImprove: "2-3 days",
            keyPatterns: ["Two pointers", "Sliding window"],
            commonMistakes: []
        }
    ];
}