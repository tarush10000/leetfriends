"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building,
    Search,
    Filter,
    CheckCircle,
    Circle,
    Clock,
    TrendingUp,
    Target,
    BookOpen,
    Calendar,
    BarChart3,
    ExternalLink,
    Star,
    RefreshCw,
    Download,
    Eye,
    EyeOff,
    Timer
} from "lucide-react";

interface InterviewQuestion {
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    frequency: number;
    acceptance: number;
    link: string;
    company: string;
    timeFrame: string; // "Thirty Days", "Three Months", etc.
    isCompleted: boolean;
    completedAt?: string;
}

interface CompanyData {
    name: string;
    logo: string;
    totalQuestions: number;
    completedQuestions: number;
    averageDifficulty: string;
    lastUpdated: string;
}

interface InterviewPrepProps {
    userEmail: string;
}

const companyLogos: Record<string, string> = {
    'AMD': '💻',
    'AQR Capital Management': '📈',
    'Accenture': '🔷',
    'Accolite': '🏢',
    'Acko': '🛡️',
    'Activision': '🎮',
    'Adobe': '🔴',
    'Affirm': '💳',
    'Google': '🔍',
    'Meta': '👤',
    'Amazon': '📦',
    'Apple': '🍎',
    'Microsoft': '🪟',
    'Netflix': '🎬',
    'Tesla': '⚡',
    'Uber': '🚗',
    'Default': '🏢'
};

const difficultyColors = {
    'Easy': 'text-green-400 bg-green-500/20 border-green-500/50',
    'Medium': 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50',
    'Hard': 'text-red-400 bg-red-500/20 border-red-500/50'
};

const timeFrameMapping: Record<string, string> = {
    '1. Thirty Days.csv': 'Last 30 Days',
    '2. Three Months.csv': 'Last 3 Months',
    '3. Six Months.csv': 'Last 6 Months',
    '4. More Than Six Months.csv': '6+ Months Ago',
    '5. All.csv': 'All Time'
};

export default function InterviewPrep({ userEmail }: InterviewPrepProps) {
    const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
    const [companies, setCompanies] = useState<CompanyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCompany, setSelectedCompany] = useState<string>('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCompleted, setShowCompleted] = useState(true);
    const [sortBy, setSortBy] = useState<'frequency' | 'difficulty' | 'acceptance'>('frequency');
    const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchInterviewData();
        fetchUserProgress();
    }, [userEmail]);

    const fetchInterviewData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/interview-prep/questions');
            if (response.ok) {
                const data = await response.json();
                setQuestions(data.questions);
                setCompanies(data.companies);
            }
        } catch (error) {
            console.error("Error fetching interview data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserProgress = async () => {
        try {
            const response = await fetch(`/api/interview-prep/progress/${userEmail}`);
            if (response.ok) {
                const data = await response.json();
                setCompletedQuestions(new Set(data.completedQuestions));
            }
        } catch (error) {
            console.error("Error fetching user progress:", error);
        }
    };

    const toggleQuestionCompletion = async (questionId: string) => {
        try {
            const isCompleted = completedQuestions.has(questionId);
            const response = await fetch('/api/interview-prep/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail,
                    questionId,
                    isCompleted: !isCompleted
                })
            });

            if (response.ok) {
                const newCompleted = new Set(completedQuestions);
                if (isCompleted) {
                    newCompleted.delete(questionId);
                } else {
                    newCompleted.add(questionId);
                }
                setCompletedQuestions(newCompleted);
            }
        } catch (error) {
            console.error("Error updating progress:", error);
        }
    };

    const filteredQuestions = questions.filter(q => {
        const companyMatch = selectedCompany === 'all' || q.company === selectedCompany;
        const difficultyMatch = selectedDifficulty === 'all' || q.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
        const timeFrameMatch = selectedTimeFrame === 'all' || q.timeFrame === selectedTimeFrame;
        const searchMatch = searchQuery === '' || 
            q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.company.toLowerCase().includes(searchQuery.toLowerCase());
        const completedMatch = showCompleted || !completedQuestions.has(q.id);
        
        return companyMatch && difficultyMatch && timeFrameMatch && searchMatch && completedMatch;
    });

    const sortedQuestions = filteredQuestions.sort((a, b) => {
        switch (sortBy) {
            case 'frequency':
                return b.frequency - a.frequency;
            case 'difficulty':
                const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
                return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
            case 'acceptance':
                return b.acceptance - a.acceptance;
            default:
                return 0;
        }
    });

    const totalQuestions = questions.length;
    const totalCompleted = completedQuestions.size;
    const completionPercentage = totalQuestions > 0 ? (totalCompleted / totalQuestions) * 100 : 0;

    const difficultyStats = {
        easy: completedQuestions.size > 0 ? questions.filter(q => completedQuestions.has(q.id) && q.difficulty === 'Easy').length : 0,
        medium: completedQuestions.size > 0 ? questions.filter(q => completedQuestions.has(q.id) && q.difficulty === 'Medium').length : 0,
        hard: completedQuestions.size > 0 ? questions.filter(q => completedQuestions.has(q.id) && q.difficulty === 'Hard').length : 0
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-6">
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 text-white">
            {/* Header */}
            <div className="p-6 border-b border-slate-800/50">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center">
                                <Building className="w-8 h-8 mr-3 text-blue-400" />
                                Interview Preparation
                            </h1>
                            <p className="text-slate-400 mt-1">
                                Real interview questions from top companies • Live data from GitHub
                            </p>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <Button
                                onClick={fetchInterviewData}
                                disabled={loading}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh Data
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Progress Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-300 text-sm font-medium">Total Progress</p>
                                    <p className="text-2xl font-bold text-white">
                                        {totalCompleted}/{totalQuestions}
                                    </p>
                                    <p className="text-xs text-slate-400">{completionPercentage.toFixed(1)}% Complete</p>
                                </div>
                                <Target className="w-8 h-8 text-purple-400" />
                            </div>
                            <div className="mt-3 w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-300 text-sm font-medium">Easy</p>
                                    <p className="text-2xl font-bold text-white">{difficultyStats.easy}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-yellow-300 text-sm font-medium">Medium</p>
                                    <p className="text-2xl font-bold text-white">{difficultyStats.medium}</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-yellow-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-300 text-sm font-medium">Hard</p>
                                    <p className="text-2xl font-bold text-white">{difficultyStats.hard}</p>
                                </div>
                                <Star className="w-8 h-8 text-red-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Companies Grid */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center">
                            <Building className="w-5 h-5 mr-2 text-blue-400" />
                            Companies ({companies.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {companies.slice(0, 12).map((company) => (
                                <motion.div
                                    key={company.name}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedCompany(company.name)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                        selectedCompany === company.name 
                                            ? 'border-purple-500/50 bg-purple-500/20' 
                                            : 'border-slate-700/50 bg-slate-700/20 hover:border-slate-600/50'
                                    }`}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-1">
                                            {companyLogos[company.name] || companyLogos.Default}
                                        </div>
                                        <p className="text-sm font-medium text-white truncate">{company.name}</p>
                                        <p className="text-xs text-slate-400">{company.totalQuestions} questions</p>
                                        <div className="text-xs text-green-400 mt-1">
                                            {company.completedQuestions}/{company.totalQuestions} done
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        {companies.length > 12 && (
                            <div className="text-center mt-4">
                                <Button variant="outline" className="border-slate-600 bg-slate-800/50">
                                    View All {companies.length} Companies
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Filters */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search questions or companies..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                                    />
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-2">
                                <select
                                    value={selectedCompany}
                                    onChange={(e) => setSelectedCompany(e.target.value)}
                                    className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                                >
                                    <option value="all">All Companies</option>
                                    {companies.map(company => (
                                        <option key={company.name} value={company.name}>{company.name}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedDifficulty}
                                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                                    className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                                >
                                    <option value="all">All Difficulties</option>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>

                                <select
                                    value={selectedTimeFrame}
                                    onChange={(e) => setSelectedTimeFrame(e.target.value)}
                                    className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                                >
                                    <option value="all">All Time</option>
                                    {Object.values(timeFrameMapping).map(timeFrame => (
                                        <option key={timeFrame} value={timeFrame}>{timeFrame}</option>
                                    ))}
                                </select>

                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                                >
                                    <option value="frequency">Sort by Frequency</option>
                                    <option value="difficulty">Sort by Difficulty</option>
                                    <option value="acceptance">Sort by Acceptance</option>
                                </select>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowCompleted(!showCompleted)}
                                    className={`border-slate-600 ${showCompleted ? 'bg-slate-700/50' : 'bg-green-600'}`}
                                >
                                    {showCompleted ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                                    {showCompleted ? 'Hide' : 'Show'} Completed
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Questions List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-white">
                            Questions ({sortedQuestions.length})
                        </h3>
                        <div className="text-sm text-slate-400">
                            Showing {sortedQuestions.length} of {questions.length} questions
                        </div>
                    </div>

                    <AnimatePresence>
                        {sortedQuestions.map((question, index) => {
                            const isCompleted = completedQuestions.has(question.id);
                            return (
                                <motion.div
                                    key={question.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.02 }}
                                >
                                    <Card className={`border transition-all hover:border-purple-500/50 ${
                                        isCompleted ? 'bg-green-500/10 border-green-500/20' : 'bg-slate-800/50 border-slate-700/50'
                                    }`}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-3 flex-1 min-w-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleQuestionCompletion(question.id)}
                                                        className="mt-1 p-0 w-6 h-6 hover:bg-transparent"
                                                    >
                                                        {isCompleted ? (
                                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                                        ) : (
                                                            <Circle className="w-5 h-5 text-slate-400 hover:text-green-400" />
                                                        )}
                                                    </Button>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <h4 className={`font-semibold ${isCompleted ? 'text-green-300' : 'text-white'} truncate`}>
                                                                {question.title}
                                                            </h4>
                                                            <Badge className={`text-xs ${difficultyColors[question.difficulty]} flex-shrink-0`}>
                                                                {question.difficulty}
                                                            </Badge>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-3 text-sm">
                                                            <div className="flex items-center text-slate-400">
                                                                <span className="mr-1">{companyLogos[question.company] || companyLogos.Default}</span>
                                                                {question.company}
                                                            </div>
                                                            
                                                            <div className="flex items-center text-blue-400">
                                                                <TrendingUp className="w-4 h-4 mr-1" />
                                                                Frequency: {question.frequency}
                                                            </div>
                                                            
                                                            <div className="flex items-center text-green-400">
                                                                <BarChart3 className="w-4 h-4 mr-1" />
                                                                {question.acceptance}% Acceptance
                                                            </div>
                                                            
                                                            <div className="flex items-center text-orange-400">
                                                                <Calendar className="w-4 h-4 mr-1" />
                                                                {question.timeFrame}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    onClick={() => window.open(question.link, '_blank')}
                                                    className="bg-purple-600 hover:bg-purple-700 flex-shrink-0 ml-3"
                                                >
                                                    <ExternalLink className="w-4 h-4 mr-1" />
                                                    Solve
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {sortedQuestions.length === 0 && (
                        <Card className="bg-slate-800/50 border-slate-700/50">
                            <CardContent className="p-8 text-center">
                                <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-white mb-2">No Questions Found</h3>
                                <p className="text-slate-400">Try adjusting your filters or search query.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}