"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
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
    Timer,
    Cpu,
    Smartphone,
    Globe,
    Car,
    CreditCard,
    Gamepad2,
    Music,
    Video,
    Briefcase,
    ShoppingCart,
    Database,
    Cloud,
    Code,
    Zap,
    Settings,
    Users,
    Layers,
    Shield,
    Activity,
    ChevronDown,
    ChevronUp,
    Grid3X3
} from "lucide-react";

interface InterviewQuestion {
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    frequency: number;
    acceptance: number;
    link: string;
    company: string;
    timeFrame: string;
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

// Lucide icons mapping for companies
const getCompanyIcon = (companyName: string) => {
    const name = companyName.toLowerCase();
    
    // Tech Giants
    if (name.includes('google')) return Globe;
    if (name.includes('meta') || name.includes('facebook')) return Users;
    if (name.includes('amazon')) return ShoppingCart;
    if (name.includes('apple')) return Smartphone;
    if (name.includes('microsoft')) return Code;
    if (name.includes('netflix')) return Video;
    if (name.includes('tesla')) return Car;
    if (name.includes('uber')) return Car;
    if (name.includes('adobe')) return Layers;
    
    // Financial/Fintech
    if (name.includes('goldman') || name.includes('jpmorgan') || name.includes('bank')) return Briefcase;
    if (name.includes('stripe') || name.includes('square') || name.includes('paypal')) return CreditCard;
    if (name.includes('visa') || name.includes('mastercard')) return CreditCard;
    if (name.includes('affirm') || name.includes('klarna')) return CreditCard;
    
    // Gaming/Entertainment
    if (name.includes('activision') || name.includes('blizzard') || name.includes('riot')) return Gamepad2;
    if (name.includes('spotify') || name.includes('soundcloud')) return Music;
    if (name.includes('tiktok') || name.includes('youtube')) return Video;
    
    // Cloud/Infrastructure
    if (name.includes('aws') || name.includes('azure') || name.includes('gcp')) return Cloud;
    if (name.includes('databricks') || name.includes('snowflake')) return Database;
    if (name.includes('cloudflare') || name.includes('akamai')) return Shield;
    
    // Hardware/Semiconductor
    if (name.includes('nvidia') || name.includes('amd') || name.includes('intel')) return Cpu;
    if (name.includes('qualcomm') || name.includes('broadcom')) return Cpu;
    
    // Social/Communication
    if (name.includes('slack') || name.includes('discord') || name.includes('zoom')) return Users;
    if (name.includes('twitter') || name.includes('linkedin')) return Users;
    
    // E-commerce/Retail
    if (name.includes('shopify') || name.includes('ebay') || name.includes('etsy')) return ShoppingCart;
    if (name.includes('doordash') || name.includes('instacart')) return ShoppingCart;
    
    // Consulting/Services
    if (name.includes('accenture') || name.includes('deloitte')) return Briefcase;
    if (name.includes('mckinsey') || name.includes('bain')) return Briefcase;
    
    // Startups/Unicorns
    if (name.includes('airbnb')) return Building;
    if (name.includes('coinbase') || name.includes('crypto')) return CreditCard;
    if (name.includes('robinhood')) return TrendingUp;
    
    // Default
    return Building;
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
    const [showAllCompanies, setShowAllCompanies] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Memoized filtered and sorted questions
    const filteredAndSortedQuestions = useMemo(() => {
        const filtered = questions.filter(q => {
            const companyMatch = selectedCompany === 'all' || q.company === selectedCompany;
            const difficultyMatch = selectedDifficulty === 'all' || q.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
            const timeFrameMatch = selectedTimeFrame === 'all' || q.timeFrame === selectedTimeFrame;
            const searchMatch = searchQuery === '' || 
                q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.company.toLowerCase().includes(searchQuery.toLowerCase());
            const completedMatch = showCompleted || !completedQuestions.has(q.id);
            
            return companyMatch && difficultyMatch && timeFrameMatch && searchMatch && completedMatch;
        });

        return filtered.sort((a, b) => {
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
    }, [questions, selectedCompany, selectedDifficulty, selectedTimeFrame, searchQuery, showCompleted, completedQuestions, sortBy]);

    // Memoized stats
    const stats = useMemo(() => {
        const totalQuestions = questions.length;
        const totalCompleted = completedQuestions.size;
        const completionPercentage = totalQuestions > 0 ? (totalCompleted / totalQuestions) * 100 : 0;

        const difficultyStats = {
            easy: questions.filter(q => completedQuestions.has(q.id) && q.difficulty === 'Easy').length,
            medium: questions.filter(q => completedQuestions.has(q.id) && q.difficulty === 'Medium').length,
            hard: questions.filter(q => completedQuestions.has(q.id) && q.difficulty === 'Hard').length
        };

        return { totalQuestions, totalCompleted, completionPercentage, difficultyStats };
    }, [questions, completedQuestions]);

    // Companies to display
    const displayedCompanies = showAllCompanies ? companies : companies.slice(0, 12);

    const fetchInterviewData = useCallback(async (forceRefresh = false) => {
        try {
            setRefreshing(forceRefresh);
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
            setRefreshing(false);
        }
    }, []);

    const fetchUserProgress = useCallback(async () => {
        try {
            const response = await fetch(`/api/interview-prep/progress/${encodeURIComponent(userEmail)}`);
            if (response.ok) {
                const data = await response.json();
                setCompletedQuestions(new Set(data.completedQuestions));
            }
        } catch (error) {
            console.error("Error fetching user progress:", error);
        }
    }, [userEmail]);

    const toggleQuestionCompletion = useCallback(async (questionId: string) => {
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
    }, [completedQuestions, userEmail]);

    useEffect(() => {
        fetchInterviewData();
        fetchUserProgress();
    }, [fetchInterviewData, fetchUserProgress]);

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
                                Real interview questions from {companies.length}+ companies • Live data from GitHub
                            </p>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <Button
                                onClick={() => fetchInterviewData(true)}
                                disabled={refreshing}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                {refreshing ? 'Refreshing...' : 'Refresh Data'}
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
                                        {stats.totalCompleted}/{stats.totalQuestions}
                                    </p>
                                    <p className="text-xs text-slate-400">{stats.completionPercentage.toFixed(1)}% Complete</p>
                                </div>
                                <Target className="w-8 h-8 text-purple-400" />
                            </div>
                            <div className="mt-3 w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                    style={{ width: `${stats.completionPercentage}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-300 text-sm font-medium">Easy</p>
                                    <p className="text-2xl font-bold text-white">{stats.difficultyStats.easy}</p>
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
                                    <p className="text-2xl font-bold text-white">{stats.difficultyStats.medium}</p>
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
                                    <p className="text-2xl font-bold text-white">{stats.difficultyStats.hard}</p>
                                </div>
                                <Star className="w-8 h-8 text-red-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Companies Grid */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center justify-between">
                            <div className="flex items-center">
                                <Building className="w-5 h-5 mr-2 text-blue-400" />
                                Companies ({companies.length})
                            </div>
                            {companies.length > 12 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAllCompanies(!showAllCompanies)}
                                    className="text-blue-400 hover:text-blue-300"
                                >
                                    {showAllCompanies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    {showAllCompanies ? 'Show Less' : 'Show All'}
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {displayedCompanies.map((company) => {
                                const IconComponent = getCompanyIcon(company.name);
                                return (
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
                                            <IconComponent className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                                            <p className="text-sm font-medium text-white truncate">{company.name}</p>
                                            <p className="text-xs text-slate-400">{company.totalQuestions} questions</p>
                                            <div className="text-xs text-green-400 mt-1">
                                                {company.completedQuestions}/{company.totalQuestions} done
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
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
                                        className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-2">
                                <select
                                    value={selectedCompany}
                                    onChange={(e) => setSelectedCompany(e.target.value)}
                                    className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="all">All Companies</option>
                                    {companies.map(company => (
                                        <option key={company.name} value={company.name}>{company.name}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedDifficulty}
                                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                                    className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="all">All Difficulties</option>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>

                                <select
                                    value={selectedTimeFrame}
                                    onChange={(e) => setSelectedTimeFrame(e.target.value)}
                                    className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="all">All Time</option>
                                    {Object.values(timeFrameMapping).map(timeFrame => (
                                        <option key={timeFrame} value={timeFrame}>{timeFrame}</option>
                                    ))}
                                </select>

                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="frequency">Sort by Frequency</option>
                                    <option value="difficulty">Sort by Difficulty</option>
                                    <option value="acceptance">Sort by Acceptance</option>
                                </select>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowCompleted(!showCompleted)}
                                    className={`border-slate-600 ${showCompleted ? 'bg-slate-700/50 text-white' : 'bg-green-600 text-white'}`}
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
                            Questions ({filteredAndSortedQuestions.length})
                        </h3>
                        <div className="text-sm text-slate-400">
                            Showing {filteredAndSortedQuestions.length} of {questions.length} questions
                        </div>
                    </div>

                    <AnimatePresence>
                        {filteredAndSortedQuestions.map((question, index) => {
                            const isCompleted = completedQuestions.has(question.id);
                            const IconComponent = getCompanyIcon(question.company);
                            
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
                                                                <IconComponent className="w-4 h-4 mr-1" />
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

                    {filteredAndSortedQuestions.length === 0 && (
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