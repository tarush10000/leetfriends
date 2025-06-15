"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
    TrendingUp,
    Calendar,
    Target,
    Award,
    Users,
    Clock,
    Flame,
    BarChart3,
    Activity,
    Zap,
    RefreshCw
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from "recharts";

interface PartyAnalyticsProps {
    partyCode: string;
    members: any[];
}

interface AnalyticsData {
    dailyActivity: Array<{
        date: string;
        problems: number;
        members: number;
    }>;
    memberProgress: Array<{
        member: string;
        easy: number;
        medium: number;
        hard: number;
        total: number;
        streak: number;
    }>;
    difficultyDistribution: Array<{
        difficulty: string;
        count: number;
        color: string;
    }>;
    weeklyTrends: Array<{
        week: string;
        problems: number;
        avgTime: number;
    }>;
}

export default function PartyAnalytics({ partyCode, members }: PartyAnalyticsProps) {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

    useEffect(() => {
        fetchAnalytics();
    }, [partyCode, timeframe]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/party/${partyCode}/analytics?timeframe=${timeframe}`);
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="p-6">
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-8 text-center">
                        <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">No Analytics Data</h3>
                        <p className="text-slate-400">Start solving problems to see analytics!</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const topPerformer = analytics.memberProgress.reduce((top, member) => 
        member.total > top.total ? member : top
    );

    const totalProblemsThisPeriod = analytics.dailyActivity.reduce((sum, day) => sum + day.problems, 0);
    const avgProblemsPerDay = totalProblemsThisPeriod / analytics.dailyActivity.length;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Party Analytics</h2>
                    <p className="text-slate-400">Track your party's coding progress and performance</p>
                </div>
                
                <div className="flex items-center space-x-2">
                    {(['7d', '30d', '90d'] as const).map((period) => (
                        <Button
                            key={period}
                            variant={timeframe === period ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTimeframe(period)}
                            className={timeframe === period ? 
                                "bg-purple-600 hover:bg-purple-700" : 
                                "border-slate-600 bg-slate-800/50 hover:bg-slate-700/50"
                            }
                        >
                            {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-300 text-sm font-medium">Total Problems</p>
                                    <p className="text-2xl font-bold text-white">{totalProblemsThisPeriod}</p>
                                    <p className="text-xs text-slate-400">Last {timeframe}</p>
                                </div>
                                <Target className="w-8 h-8 text-purple-400" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-300 text-sm font-medium">Daily Average</p>
                                    <p className="text-2xl font-bold text-white">{avgProblemsPerDay.toFixed(1)}</p>
                                    <p className="text-xs text-slate-400">Problems/day</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-blue-400" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-300 text-sm font-medium">Top Performer</p>
                                    <p className="text-lg font-bold text-white truncate">{topPerformer.member}</p>
                                    <p className="text-xs text-slate-400">{topPerformer.total} problems</p>
                                </div>
                                <Award className="w-8 h-8 text-green-400" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-300 text-sm font-medium">Best Streak</p>
                                    <p className="text-2xl font-bold text-white">
                                        {Math.max(...analytics.memberProgress.map(m => m.streak))}
                                    </p>
                                    <p className="text-xs text-slate-400">Days</p>
                                </div>
                                <Flame className="w-8 h-8 text-orange-400" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Activity Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="bg-slate-800/50 border-slate-700/50">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center">
                                <Activity className="w-5 h-5 mr-2 text-blue-400" />
                                Daily Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={analytics.dailyActivity}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#9CA3AF"
                                        fontSize={12}
                                    />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="problems"
                                        stroke="#8B5CF6"
                                        fill="url(#colorGradient)"
                                        strokeWidth={2}
                                    />
                                    <defs>
                                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05}/>
                                        </linearGradient>
                                    </defs>
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Difficulty Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="bg-slate-800/50 border-slate-700/50">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center">
                                <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
                                Difficulty Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={analytics.difficultyDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="count"
                                    >
                                        {analytics.difficultyDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center space-x-4 mt-4">
                                {analytics.difficultyDistribution.map((item) => (
                                    <div key={item.difficulty} className="flex items-center">
                                        <div 
                                            className="w-3 h-3 rounded-full mr-2"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-sm text-slate-300">
                                            {item.difficulty}: {item.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Member Progress Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
            >
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center">
                            <Users className="w-5 h-5 mr-2 text-purple-400" />
                            Member Progress Comparison
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left py-3 px-2 text-slate-300 font-medium">Member</th>
                                        <th className="text-center py-3 px-2 text-slate-300 font-medium">Easy</th>
                                        <th className="text-center py-3 px-2 text-slate-300 font-medium">Medium</th>
                                        <th className="text-center py-3 px-2 text-slate-300 font-medium">Hard</th>
                                        <th className="text-center py-3 px-2 text-slate-300 font-medium">Total</th>
                                        <th className="text-center py-3 px-2 text-slate-300 font-medium">Streak</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.memberProgress.map((member, index) => (
                                        <tr key={member.member} className="border-b border-slate-700/50">
                                            <td className="py-3 px-2">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                                                        <span className="text-white text-xs font-bold">
                                                            {member.member.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="text-white font-medium">{member.member}</span>
                                                </div>
                                            </td>
                                            <td className="text-center py-3 px-2 text-green-400 font-semibold">
                                                {member.easy}
                                            </td>
                                            <td className="text-center py-3 px-2 text-yellow-400 font-semibold">
                                                {member.medium}
                                            </td>
                                            <td className="text-center py-3 px-2 text-red-400 font-semibold">
                                                {member.hard}
                                            </td>
                                            <td className="text-center py-3 px-2 text-white font-bold">
                                                {member.total}
                                            </td>
                                            <td className="text-center py-3 px-2">
                                                <div className="flex items-center justify-center">
                                                    <Flame className="w-4 h-4 text-orange-400 mr-1" />
                                                    <span className="text-orange-400 font-semibold">
                                                        {member.streak}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Weekly Trends */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
            >
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-cyan-400" />
                            Weekly Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={analytics.weeklyTrends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis 
                                    dataKey="week" 
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                />
                                <YAxis stroke="#9CA3AF" fontSize={12} />
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar 
                                    dataKey="problems" 
                                    fill="url(#barGradient)"
                                    radius={[4, 4, 0, 0]}
                                />
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}