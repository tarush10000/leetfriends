"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle,
    Circle,
    Calendar,
    Clock,
    Target,
    BookOpen,
    ExternalLink,
    Play,
    Pause,
    RotateCcw,
    TrendingUp,
    Award,
    Flame,
    Route,
    ChevronRight,
    ChevronLeft,
    Star,
    Brain,
    Code,
    Timer,
    CheckSquare,
    Square
} from "lucide-react";

interface LeetCodeProblem {
    title: string;
    number: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    url: string;
    topics: string[];
    pattern: string;
    estimatedTime: string;
    notes?: string;
    completed?: boolean;
    completedAt?: Date;
}

interface LearningPathDay {
    day: number;
    topic: string;
    subtopic: string;
    problemCount: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
    estimatedTime: string;
    concepts: string[];
    problems: LeetCodeProblem[];
    goals: string[];
    resources?: string[];
    completed?: boolean;
}

interface LearningPath {
    id: string;
    title: string;
    description: string;
    duration: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    progress: {
        daysCompleted: number;
        problemsCompleted: number;
        totalProblems: number;
        currentDay: number;
    };
    days: LearningPathDay[];
    status: 'generated' | 'accepted' | 'in_progress' | 'completed' | 'paused';
}

interface LearningPathProps {
    userEmail: string;
    refreshSignal?: number;
}

export default function LearningPathComponent({ userEmail, refreshSignal }: LearningPathProps) {
    const [activePath, setActivePath] = useState<LearningPath | null>(null);
    const [todayData, setTodayData] = useState<LearningPathDay | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    useEffect(() => {
        loadCurrentPath();
    }, [userEmail, refreshSignal]);

    const markDayComplete = async (day: number) => {
        if (!activePath) return;
        setUpdating(true);
        try {
            const res = await fetch('/api/learning-path/mark-day-complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ learningPathId: activePath.id, day })
            });
            if (res.ok) {
                await loadCurrentPath();
            }
        } catch (e) {
            console.error('Failed to mark day complete:', e);
        } finally {
            setUpdating(false);
        }
    };

    const loadCurrentPath = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/learning-path/current');
            if (response.ok) {
                const data = await response.json();
                setActivePath(data.activePath);
                setTodayData(data.activePath?.todayData || null);
                setSelectedDay(data.activePath?.progress?.currentDay || null);
            }
        } catch (error) {
            console.error('Failed to load learning path:', error);
        } finally {
            setLoading(false);
        }
    };

    const markProblemCompleted = async (problemNumber: number, day: number) => {
        if (!activePath) return;

        setUpdating(true);
        try {
            const response = await fetch('/api/learning-path/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    learningPathId: activePath.id,
                    day,
                    problemCompleted: true,
                    problemNumber
                })
            });

            if (response.ok) {
                const result = await response.json();

                // Update local state
                if (todayData && day === activePath.progress.currentDay) {
                    const updatedProblems = todayData.problems.map(p =>
                        p.number === problemNumber
                            ? { ...p, completed: true, completedAt: new Date() }
                            : p
                    );
                    setTodayData({ ...todayData, problems: updatedProblems });
                }

                // Update progress
                setActivePath(prev => prev ? {
                    ...prev,
                    progress: {
                        ...prev.progress,
                        problemsCompleted: prev.progress.problemsCompleted + 1,
                        ...(result.dayCompleted && {
                            daysCompleted: prev.progress.daysCompleted + 1,
                            currentDay: result.nextDay
                        })
                    }
                } : null);

                if (result.dayCompleted) {
                    // Load next day
                    await loadCurrentPath();
                }
            }
        } catch (error) {
            console.error('Failed to update progress:', error);
        } finally {
            setUpdating(false);
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return 'text-green-400 bg-green-500/10 border-green-500/30';
            case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            case 'hard': return 'text-red-400 bg-red-500/10 border-red-500/30';
            default: return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        }
    };

    const calculateDayProgress = (day: LearningPathDay) => {
        const completedProblems = day.problems.filter(p => p.completed).length;
        return (completedProblems / day.problems.length) * 100;
    };

    const getOverallProgress = () => {
        if (!activePath) return 0;
        return (activePath.progress.daysCompleted / activePath.duration) * 100;
    };

    const getCurrentStreak = () => {
        if (!activePath) return 0;
        return activePath.progress.daysCompleted;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Route className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-pulse" />
                    <p className="text-white font-medium">Loading your learning path...</p>
                </div>
            </div>
        );
    }

    if (!activePath) {
        return (
            <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-8 text-center">
                    <Route className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Active Learning Path</h3>
                    <p className="text-slate-400 mb-4">
                        Create a personalized learning path to get daily problem recommendations!
                    </p>
                    <Button
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        onClick={async () => {
                            setLoading(true);
                            try {
                                const response = await fetch('/api/learning-path/generate', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ userEmail }),
                                });
                                if (response.ok) {
                                    await loadCurrentPath();
                                }
                            } catch (error) {
                                console.error('Failed to generate learning path:', error);
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        <Route className="w-4 h-4 mr-2" />
                        Create Learning Path
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Progress */}
            <Card className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/30">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center">
                                <Route className="w-6 h-6 mr-2 text-purple-400" />
                                {activePath.title}
                            </h2>
                            <p className="text-slate-300 mt-1">{activePath.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                    Day {activePath.progress.currentDay} of {activePath.duration}
                                </Badge>
                                <Badge className={getDifficultyColor(activePath.difficulty)}>
                                    {activePath.difficulty}
                                </Badge>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-purple-400">{getCurrentStreak()}</p>
                                    <p className="text-xs text-slate-400">Day Streak</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-400">{activePath.progress.problemsCompleted}</p>
                                    <p className="text-xs text-slate-400">Problems Solved</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-400">{Math.round(getOverallProgress())}%</p>
                                    <p className="text-xs text-slate-400">Complete</p>
                                </div>
                            </div>

                            {/* Custom Progress Bar */}
                            <div className="w-full bg-slate-700/50 rounded-full h-2 mt-3">
                                <div
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${getOverallProgress()}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Today's Tasks */}
            {todayData && (
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-white flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                                Today's Focus: {todayData.topic}
                            </CardTitle>
                            <div className="flex items-center space-x-2">
                                <Badge className={getDifficultyColor(todayData.difficulty)}>
                                    {todayData.difficulty}
                                </Badge>
                                <div className="flex items-center text-sm text-slate-400">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {todayData.estimatedTime}
                                </div>
                            </div>
                        </div>
                        <p className="text-slate-400">{todayData.subtopic}</p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div>
                            <h4 className="text-white font-medium mb-3 flex items-center">
                                <Target className="w-4 h-4 mr-2 text-green-400" />
                                Today's Goals
                            </h4>
                            <div className="grid gap-2">
                                {todayData.goals.map((goal, index) => (
                                    <div key={index} className="flex items-start text-slate-300 text-sm">
                                        <Star className="w-4 h-4 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                                        <span>{goal}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Key Concepts */}
                        <div>
                            <h4 className="text-white font-medium mb-3 flex items-center">
                                <Brain className="w-4 h-4 mr-2 text-purple-400" />
                                Key Concepts
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {todayData.concepts.map((concept, index) => (
                                    <Badge key={index} variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                        {concept}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Problems Checklist */}
                        <div>
                            <h4 className="text-white font-medium mb-3 flex items-center">
                                <CheckSquare className="w-4 h-4 mr-2 text-blue-400" />
                                Problems to Solve ({todayData.problems.filter(p => p.completed).length}/{todayData.problems.length})
                            </h4>

                            <div className="space-y-3">
                                {todayData.problems.map((problem, index) => (
                                    <motion.div
                                        key={problem.number}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className={`bg-slate-700/30 border-slate-600/50 transition-all duration-200 ${problem.completed ? 'opacity-75 border-green-500/30' : 'hover:bg-slate-700/50'
                                            }`}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => markProblemCompleted(problem.number, todayData.day)}
                                                            disabled={problem.completed || updating}
                                                        >
                                                            {problem.completed ? (
                                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                                            ) : (
                                                                <Circle className="w-5 h-5 text-slate-400 hover:text-white" />
                                                            )}
                                                        </Button>

                                                        <div>
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-white font-medium">
                                                                    {problem.number}. {problem.title}
                                                                </span>
                                                                <Badge className={getDifficultyColor(problem.difficulty)}>
                                                                    {problem.difficulty}
                                                                </Badge>
                                                            </div>

                                                            <div className="flex items-center space-x-4 mt-1 text-sm text-slate-400">
                                                                <div className="flex items-center">
                                                                    <Code className="w-3 h-3 mr-1" />
                                                                    {problem.pattern}
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <Timer className="w-3 h-3 mr-1" />
                                                                    {problem.estimatedTime}
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {problem.topics.map((topic, idx) => (
                                                                    <Badge key={idx} variant="outline" className="text-xs border-slate-600 text-slate-400">
                                                                        {topic}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        {problem.completed && problem.completedAt && (
                                                            <span className="text-xs text-green-400">
                                                                ✓ {new Date(problem.completedAt).toLocaleTimeString()}
                                                            </span>
                                                        )}

                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-slate-600 hover:border-blue-500"
                                                            onClick={() => window.open(problem.url, '_blank')}
                                                        >
                                                            <ExternalLink className="w-4 h-4 mr-1" />
                                                            Solve
                                                        </Button>
                                                    </div>
                                                </div>

                                                {problem.notes && (
                                                    <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border-l-2 border-blue-500/50">
                                                        <p className="text-sm text-slate-300">
                                                            💡 {problem.notes}
                                                        </p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>

                                ))}
                            </div>
                        </div>

                        {/* Progress for today */}
                        <div className="pt-4 border-t border-slate-700/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-400">Today's Progress</span>
                                <span className="text-sm text-white font-medium">
                                    {Math.round(calculateDayProgress(todayData))}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-700/50 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${calculateDayProgress(todayData)}%` }}
                                />
                            </div>
                        </div>

                        {/* Resources */}
                        {todayData.resources && todayData.resources.length > 0 && (
                            <div>
                                <h4 className="text-white font-medium mb-3 flex items-center">
                                    <BookOpen className="w-4 h-4 mr-2 text-orange-400" />
                                    Additional Resources
                                </h4>
                                <div className="space-y-2">
                                    {todayData.resources.map((resource, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            size="sm"
                                            className="justify-start border-slate-600 hover:border-orange-500"
                                            onClick={() => window.open(resource, '_blank')}
                                        >
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Study Material {index + 1}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Quick Navigation */}
            <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Learning Path Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 gap-2">
                        {activePath.days.slice(0, 21).map((day, index) => {
                            const isCompleted = index + 1 <= activePath.progress.daysCompleted;
                            const isCurrent = index + 1 === activePath.progress.currentDay;
                            const isAccessible = index + 1 <= activePath.progress.currentDay;

                            return (
                                <Button
                                    key={day.day}
                                    size="sm"
                                    variant={isCurrent ? "default" : "outline"}
                                    className={`aspect-square p-0 text-xs ${isCompleted ? 'bg-green-600 hover:bg-green-700 border-green-500' :
                                        isCurrent ? 'bg-purple-600 hover:bg-purple-700' :
                                            isAccessible ? 'border-slate-600 hover:border-blue-500' :
                                                'border-slate-700 text-slate-500 cursor-not-allowed'
                                        }`}
                                    disabled={!isAccessible}
                                    onClick={() => setSelectedDay(day.day)}
                                >
                                    {isCompleted ? <CheckCircle className="w-3 h-3" /> : day.day}
                                </Button>
                            );
                        })}
                    </div>

                    {activePath.days.length > 21 && (
                        <p className="text-xs text-slate-400 mt-2 text-center">
                            Showing first 21 days • {activePath.days.length - 21} more days available
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Full Learning Path Schedule
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {activePath.days.map(day => (
                        <div key={day.day} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-white font-semibold">Day {day.day}: {day.topic}</div>
                                <Badge className={getDifficultyColor(day.difficulty)}>{day.difficulty}</Badge>
                            </div>
                            <div className="text-slate-400 text-sm mt-1">{day.subtopic}</div>
                            <div className="text-slate-300 text-xs mt-1">Estimated Time: {day.estimatedTime}</div>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {day.concepts.map((concept, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs border-slate-600 text-slate-400">
                                        {concept}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}