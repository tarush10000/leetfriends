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
    Grid3X3,
    Archive
} from "lucide-react";

interface InterviewQuestion {
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    frequency: number;
    acceptance: number;
    link: string;
    company: string; // Primary company
    companies: Array<{
        name: string;
        frequency: number;
        tier: string;
        timePeriod: string;
    }>; // All companies that asked this question
    companyCount: number;
    timeFrame: string;
    topics: string[];
    companyTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
    priorityScore: number;
    recencyScore: number;
    isCompleted: boolean;
}

interface CompanyData {
    name: string;
    totalQuestions: number;
    avgFrequency: number;
    recentQuestions: number;
    tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
    completedQuestions: number;
}

interface StatsData {
    totalQuestions: number;
    totalCombinations: number;
    recentQuestions: number;
    topicDistribution: Array<{ _id: string, count: number }>;
    difficultyDistribution: Array<{ _id: string, count: number }>;
    tier1Companies: string[];
    tier2Companies: string[];
}

interface PaginationData {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
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
    const [stats, setStats] = useState<StatsData | null>(null);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Filters
    const [selectedCompany, setSelectedCompany] = useState<string>('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<string>('Last 30 Days');
    const [selectedTier, setSelectedTier] = useState<string>('all');
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [minFrequency, setMinFrequency] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'frequency' | 'recent' | 'acceptance' | 'difficulty'>('recent');

    // UI State
    const [showCompleted, setShowCompleted] = useState(true);
    const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
    const [showAllCompanies, setShowAllCompanies] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [view, setView] = useState<'all' | 'tier1' | 'tier2' | 'popular'>('popular');

    // Remove old memoized calculations since we now get data from API
    // Companies to display 
    const displayedCompanies = showAllCompanies ? companies : companies.slice(0, 12);

    const fetchInterviewData = useCallback(async (append = false, forceRefresh = false) => {
        try {
            if (!append) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            setRefreshing(forceRefresh);

            // Build query parameters
            const params = new URLSearchParams();
            if (selectedCompany !== 'all') params.set('company', selectedCompany);
            if (selectedDifficulty !== 'all') params.set('difficulty', selectedDifficulty);
            if (selectedTimeFrame !== 'all') params.set('time_period', selectedTimeFrame);
            if (selectedTopics.length > 0) params.set('topics', selectedTopics.join(','));
            if (minFrequency > 0) params.set('min_frequency', minFrequency.toString());
            if (searchQuery) params.set('search', searchQuery);
            params.set('sort_by', sortBy);
            params.set('limit', '50');
            params.set('offset', append ? questions.length.toString() : '0');

            // Apply view-based filters
            if (view === 'tier1' && selectedCompany === 'all') {
                // Will be handled by tier filtering in backend
            }

            const response = await fetch(`/api/interview-prep/questions?${params.toString()}`);

            if (response.ok) {
                const data = await response.json();

                if (append) {
                    setQuestions(prev => [...prev, ...data.questions]);
                } else {
                    setQuestions(data.questions);
                    setCompanies(data.companies);
                    setStats(data.stats);
                }

                setPagination(data.pagination);

                // Update completion status
                const updatedQuestions = (append ? [...questions, ...data.questions] : data.questions).map((q: InterviewQuestion) => ({
                    ...q,
                    isCompleted: completedQuestions.has(q.id)
                }));

                setQuestions(updatedQuestions);
            }
        } catch (error) {
            console.error("Error fetching interview data:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [selectedCompany, selectedDifficulty, selectedTimeFrame, selectedTopics, minFrequency, searchQuery, sortBy, view, questions.length, completedQuestions]);

    const loadMore = useCallback(() => {
        if (pagination?.hasMore && !loadingMore) {
            fetchInterviewData(true);
        }
    }, [pagination?.hasMore, loadingMore, fetchInterviewData]);

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

    // Trigger new search when filters change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchInterviewData();
        }, 300); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [selectedCompany, selectedDifficulty, selectedTimeFrame, selectedTier, selectedTopics, minFrequency, searchQuery, sortBy, view]);

    useEffect(() => {
        fetchUserProgress();
    }, [fetchUserProgress]);

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
                                Smart interview preparation with {companies.length}+ companies • MongoDB-powered analytics
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
                {/* Enhanced Progress Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-300 text-sm font-medium">Your Progress</p>
                                    <p className="text-2xl font-bold text-white">
                                        {stats?.totalQuestions ? Math.round((completedQuestions.size / stats.totalQuestions) * 100) : 0}%
                                    </p>
                                    <p className="text-xs text-slate-400">{completedQuestions.size} completed</p>
                                </div>
                                <Target className="w-8 h-8 text-purple-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-300 text-sm font-medium">Total Questions</p>
                                    <p className="text-2xl font-bold text-white">{stats?.totalQuestions?.toLocaleString() || 0}</p>
                                    <p className="text-xs text-slate-400">Across {companies.length} companies</p>
                                </div>
                                <BarChart3 className="w-8 h-8 text-blue-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-300 text-sm font-medium">Tier 1 Companies</p>
                                    <p className="text-2xl font-bold text-white">{stats?.tier1Companies?.length || 0}</p>
                                    <p className="text-xs text-slate-400">FAANG+ companies</p>
                                </div>
                                <Star className="w-8 h-8 text-green-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-yellow-300 text-sm font-medium">Recent Questions</p>
                                    <p className="text-2xl font-bold text-white">
                                        {stats?.recentQuestions || 0}
                                    </p>
                                    <p className="text-xs text-slate-400">Last 3 months</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-yellow-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-300 text-sm font-medium">Avg Frequency</p>
                                    <p className="text-2xl font-bold text-white">
                                        {companies.length > 0 ? Math.round(companies.reduce((acc, c) => acc + c.avgFrequency, 0) / companies.length) : 0}
                                    </p>
                                    <p className="text-xs text-slate-400">Per company</p>
                                </div>
                                <Activity className="w-8 h-8 text-red-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Enhanced Companies Grid */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center justify-between">
                            <div className="flex items-center">
                                <Building className="w-5 h-5 mr-2 text-blue-400" />
                                Companies by Tier
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
                        {/* Tier 1 Companies */}
                        <div className="mb-6">
                            <h4 className="text-green-400 font-semibold mb-3 flex items-center">
                                <Star className="w-4 h-4 mr-2" />
                                Tier 1 - FAANG+ ({companies.filter(c => c.tier === 'Tier 1').length})
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {companies.filter(c => c.tier === 'Tier 1').slice(0, showAllCompanies ? undefined : 6).map((company) => (
                                    <CompanyCard key={company.name} company={company} selectedCompany={selectedCompany} setSelectedCompany={setSelectedCompany} />
                                ))}
                            </div>
                        </div>

                        {/* Tier 2 Companies */}
                        <div className="mb-6">
                            <h4 className="text-blue-400 font-semibold mb-3 flex items-center">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Tier 2 - Unicorns & Finance ({companies.filter(c => c.tier === 'Tier 2').length})
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {companies.filter(c => c.tier === 'Tier 2').slice(0, showAllCompanies ? undefined : 6).map((company) => (
                                    <CompanyCard key={company.name} company={company} selectedCompany={selectedCompany} setSelectedCompany={setSelectedCompany} />
                                ))}
                            </div>
                        </div>

                        {/* Tier 3 Companies - Only show if expanded */}
                        {showAllCompanies && (
                            <div>
                                <h4 className="text-slate-400 font-semibold mb-3 flex items-center">
                                    <Building className="w-4 h-4 mr-2" />
                                    Other Companies ({companies.filter(c => c.tier === 'Tier 3').length})
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-2">
                                    {companies.filter(c => c.tier === 'Tier 3').map((company) => (
                                        <CompanyCard key={company.name} company={company} selectedCompany={selectedCompany} setSelectedCompany={setSelectedCompany} compact />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Enhanced Filters */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-4">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search questions, companies, or topics..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Primary Filters */}
                            <div className="flex flex-wrap gap-3">
                                <select
                                    value={selectedCompany}
                                    onChange={(e) => setSelectedCompany(e.target.value)}
                                    className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="all">All Companies</option>
                                    <optgroup label="Tier 1 - FAANG+">
                                        {companies.filter(c => c.tier === 'Tier 1').map(company => (
                                            <option key={company.name} value={company.name}>
                                                {company.name} ({company.recentQuestions} recent)
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Tier 2 - Unicorns">
                                        {companies.filter(c => c.tier === 'Tier 2').map(company => (
                                            <option key={company.name} value={company.name}>
                                                {company.name} ({company.recentQuestions} recent)
                                            </option>
                                        ))}
                                    </optgroup>
                                    {showAllCompanies && (
                                        <optgroup label="Other Companies">
                                            {companies.filter(c => c.tier === 'Tier 3').map(company => (
                                                <option key={company.name} value={company.name}>
                                                    {company.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>

                                <select
                                    value={selectedTimeFrame}
                                    onChange={(e) => setSelectedTimeFrame(e.target.value)}
                                    className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="all">All Time Periods</option>
                                    <option value="Last 30 Days">
                                        Last 30 Days
                                    </option>
                                    <option value="Last 3 Months">
                                        Last 3 Months
                                    </option>
                                    <option value="Last 6 Months">
                                        Last 6 Months
                                    </option>
                                    <option value="6+ Months Ago">
                                        6+ Months Ago
                                    </option>
                                </select>

                                <select
                                    value={selectedDifficulty}
                                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                                    className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="all">All Difficulties</option>
                                    <option value="easy">
                                        Easy
                                    </option>
                                    <option value="medium">
                                        Medium
                                    </option>
                                    <option value="hard">
                                        Hard
                                    </option>
                                </select>

                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="recent">
                                        Most Recent
                                    </option>
                                    <option value="frequency">
                                        Highest Frequency
                                    </option>
                                    <option value="acceptance">
                                        Acceptance Rate
                                    </option>
                                    <option value="difficulty">
                                        Difficulty
                                    </option>
                                </select>
                            </div>

                            {/* Advanced Filters */}
                            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-700">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-slate-300">Min Frequency:</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={minFrequency}
                                        onChange={(e) => setMinFrequency(parseInt(e.target.value))}
                                        className="w-20"
                                    />
                                    <span className="text-sm text-slate-400 w-8">{minFrequency}</span>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowCompleted(!showCompleted)}
                                    className={`border-slate-600 ${showCompleted ? 'bg-slate-700/50 text-white' : 'bg-green-600 text-white'}`}
                                >
                                    {showCompleted ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                                    {showCompleted ? 'Hide' : 'Show'} Completed
                                </Button>

                                <div className="text-sm text-slate-400">
                                    Showing {questions.length} questions
                                    {pagination && ` of ${pagination.total.toLocaleString()}`}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Enhanced Questions List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-white">
                            Questions ({questions.length})
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="text-sm text-slate-400">
                                {pagination && `Page ${Math.floor(pagination.offset / 50) + 1} of ${Math.ceil(pagination.total / 50)}`}
                            </div>
                            <Button
                                onClick={() => fetchInterviewData(false, true)}
                                disabled={refreshing}
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {questions.map((question, index) => {
                            const isCompleted = completedQuestions.has(question.id);
                            const IconComponent = getCompanyIcon(question.company);

                            return (
                                <motion.div
                                    key={`${question.id}-${question.company}-${question.timeFrame}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.01 }}
                                >
                                    <Card className={`border transition-all hover:border-purple-500/50 ${isCompleted ? 'bg-green-500/10 border-green-500/20' : 'bg-slate-800/50 border-slate-700/50'
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

                                                            {/* Company Tier Badge */}
                                                            <Badge className={`text-xs flex-shrink-0 ${question.companyTier === 'Tier 1' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                                                                question.companyTier === 'Tier 2' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' :
                                                                    'bg-slate-500/20 text-slate-400 border-slate-500/50'
                                                                }`}>
                                                                {question.companyTier}
                                                            </Badge>

                                                            {/* High Priority Indicator */}
                                                            {question.priorityScore > 100 && (
                                                                <Badge className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/50 flex items-center">
                                                                    <Zap className="w-3 h-3 mr-1" />
                                                                    Hot
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-3 text-sm mb-2">
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

                                                            <div className="flex items-center text-purple-400">
                                                                <Star className="w-4 h-4 mr-1" />
                                                                Score: {Math.round(question.priorityScore)}
                                                            </div>
                                                        </div>

                                                        {/* All Companies Breakdown - Always show if exists */}
                                                        {question.companies && question.companies.length > 0 && (
                                                            <div className="mb-2">
                                                                <p className="text-xs text-slate-500 mb-1">
                                                                    Asked by {question.companies.length} companies:
                                                                </p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {question.companies.slice(0, 8).map((company, idx) => (
                                                                        <Badge
                                                                            key={`${company.name}-${idx}`}
                                                                            className={`text-xs ${company.tier === 'Tier 1' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                                                                                    company.tier === 'Tier 2' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' :
                                                                                        'bg-slate-500/20 text-slate-400 border-slate-500/50'
                                                                                }`}
                                                                        >
                                                                            {company.name} ({company.frequency})
                                                                        </Badge>
                                                                    ))}
                                                                    {question.companies.length > 8 && (
                                                                        <Badge className="text-xs bg-slate-500/20 text-slate-400">
                                                                            +{question.companies.length - 8} more
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Topics */}
                                                        {question.topics && question.topics.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {question.topics.slice(0, 4).map(topic => (
                                                                    <Badge
                                                                        key={topic}
                                                                        className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30"
                                                                    >
                                                                        {topic.replace('_', ' ')}
                                                                    </Badge>
                                                                ))}
                                                                {question.topics.length > 4 && (
                                                                    <Badge className="text-xs bg-slate-500/20 text-slate-400">
                                                                        +{question.topics.length - 4} more
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        )}
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

                    {/* Load More Button */}
                    {pagination?.hasMore && (
                        <div className="flex justify-center py-6">
                            <Button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {loadingMore ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4 mr-2" />
                                        Load More Questions
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* No Questions Found */}
                    {questions.length === 0 && !loading && (
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

// Company Card Component
const CompanyCard = ({ company, selectedCompany, setSelectedCompany, compact = false }: {
    company: CompanyData;
    selectedCompany: string;
    setSelectedCompany: (company: string) => void;
    compact?: boolean;
}) => {
    const IconComponent = getCompanyIcon(company.name);
    const isSelected = selectedCompany === company.name;

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedCompany(company.name)}
            className={`${compact ? 'p-2' : 'p-3'} rounded-lg border cursor-pointer transition-all ${isSelected
                ? 'border-purple-500/50 bg-purple-500/20'
                : `border-slate-700/50 bg-slate-700/20 hover:border-slate-600/50 ${company.tier === 'Tier 1' ? 'hover:border-green-500/30' :
                    company.tier === 'Tier 2' ? 'hover:border-blue-500/30' :
                        'hover:border-slate-500/30'
                }`
                }`}
        >
            <div className="text-center">
                <IconComponent className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} mx-auto mb-1 ${company.tier === 'Tier 1' ? 'text-green-400' :
                    company.tier === 'Tier 2' ? 'text-blue-400' :
                        'text-slate-400'
                    }`} />
                <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-white truncate`}>
                    {company.name}
                </p>
                {!compact && (
                    <>
                        <p className="text-xs text-slate-400">
                            {company.totalQuestions} questions
                        </p>
                        <div className="text-xs mt-1">
                            <span className="text-orange-400">{company.recentQuestions} recent</span>
                            {company.avgFrequency > 0 && (
                                <span className="text-slate-500 mx-1">•</span>
                            )}
                            {company.avgFrequency > 0 && (
                                <span className="text-blue-400">avg {company.avgFrequency}</span>
                            )}
                        </div>
                    </>
                )}
                {compact && (
                    <p className="text-xs text-slate-500">{company.totalQuestions}</p>
                )}
            </div>
        </motion.div>
    );
};