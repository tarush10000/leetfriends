// components/InterviewPrep2.tsx - Enhanced UI with scrollable design and immediate feedback
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mic, MicOff, Play, Pause, SkipForward, Volume2, VolumeX,
    ChevronRight, Trophy, Clock, Target, Brain, Sparkles,
    CheckCircle, AlertCircle, Download, Share2, X, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InterviewPrepProps {
    onExit?: () => void;
}

interface Question {
    id: string;
    question: string;
    topic: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    expectedPoints: string[];
    userAnswer?: string;
    score?: number;
    feedback?: string[];
}

interface InterviewSettings {
    numberOfQuestions: number;
    topics: string[];
    enableSTT: boolean;
    showConfidence: boolean;
}

const AVAILABLE_TOPICS = [
    { id: 'oop', label: 'Object-Oriented Programming', color: 'bg-blue-500' },
    { id: 'os', label: 'Operating Systems', color: 'bg-green-500' },
    { id: 'dbms', label: 'Database Management', color: 'bg-purple-500' },
    { id: 'networks', label: 'Computer Networks', color: 'bg-orange-500' }
];

export default function InterviewPrep({ onExit }: InterviewPrepProps) {
    const [stage, setStage] = useState<'setup' | 'interview' | 'results'>('setup');
    const [settings, setSettings] = useState<InterviewSettings>({
        numberOfQuestions: 5,
        topics: [],
        enableSTT: true,
        showConfidence: true
    });

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [speechRecognition, setSpeechRecognition] = useState<any>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const { toast } = useToast();

    // Enhanced answer submission with immediate feedback
    const submitAnswer = async () => {
        if (!currentAnswer.trim()) {
            toast({
                title: "Empty Answer",
                description: "Please provide an answer before submitting",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/interview-prep/evaluate-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: questions[currentQuestionIndex],
                    answer: currentAnswer
                })
            });

            if (!response.ok) throw new Error('Evaluation failed');

            const evaluation = await response.json();

            // Update question with evaluation
            const updatedQuestions = [...questions];
            updatedQuestions[currentQuestionIndex] = {
                ...updatedQuestions[currentQuestionIndex],
                userAnswer: currentAnswer,
                score: evaluation.score,
                feedback: evaluation.feedback
            };
            setQuestions(updatedQuestions);

            // Show immediate feedback
            setShowFeedback(true);

            // Auto-hide feedback after 5 seconds and move to next question
            setTimeout(() => {
                setShowFeedback(false);
                if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                    setCurrentAnswer("");
                } else {
                    // Interview completed
                    setStage('results');
                }
            }, 5000);

        } catch (error) {
            console.error('Evaluation error:', error);
            toast({
                title: "Error",
                description: "Failed to evaluate answer. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // PDF Generation Function
    const generatePDF = async () => {
        setIsGeneratingPDF(true);
        try {
            const pdfData = {
                questions: questions.map(q => ({
                    question: q.question,
                    userAnswer: q.userAnswer || 'No answer provided',
                    score: q.score || 0,
                    feedback: q.feedback || [],
                    topic: q.topic,
                    difficulty: q.difficulty
                })),
                overallScore: calculateOverallScore(),
                totalQuestions: questions.length,
                answeredQuestions: questions.filter(q => q.score !== undefined).length,
                timestamp: new Date().toISOString()
            };

            const response = await fetch('/api/interview-prep/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pdfData)
            });

            if (!response.ok) throw new Error('PDF generation failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `interview-results-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: "PDF Downloaded",
                description: "Your interview results have been downloaded successfully.",
            });

        } catch (error) {
            console.error('PDF generation error:', error);
            toast({
                title: "Error",
                description: "Failed to generate PDF. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    // Calculate overall score
    const calculateOverallScore = () => {
        const answeredQuestions = questions.filter(q => q.score !== undefined);
        if (answeredQuestions.length === 0) return 0;
        const totalScore = answeredQuestions.reduce((sum, q) => sum + (q.score || 0), 0);
        return Math.round(totalScore / answeredQuestions.length);
    };

    // Toggle recording for speech-to-text
    const toggleRecording = () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            toast({
                title: "Speech Recognition Not Supported",
                description: "Your browser does not support Speech-to-Text.",
                variant: "destructive"
            });
            return;
        }

        if (isRecording) {
            if (speechRecognition) {
                speechRecognition.stop();
            }
            setIsRecording(false);
        } else {
            // @ts-expect-error - Browser speech recognition types not fully supported
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = "en-US";
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setCurrentAnswer(prev => prev ? prev + " " + transcript : transcript);
            };
            recognition.onerror = (event: any) => {
                toast({
                    title: "Speech Recognition Error",
                    description: event.error || "An error occurred during speech recognition.",
                    variant: "destructive"
                });
                setIsRecording(false);
            };
            recognition.onend = () => {
                setIsRecording(false);
            };

            setSpeechRecognition(recognition);
            setIsRecording(true);
            recognition.start();
        }
    };

    // Skip to the next question or end interview if last question
    const skipQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setCurrentAnswer("");
            setShowFeedback(false);
        } else {
            setStage('results');
        }
    };

    // Function to start the interview and generate questions
    const startInterview = async () => {
        if (settings.topics.length === 0) {
            toast({
                title: "No Topics Selected",
                description: "Please select at least one topic to start the interview.",
                variant: "destructive"
            });
            return;
        }
        
        setLoading(true);
        try {
            // Add randomization seed to ensure different questions each time
            const randomSeed = Math.random().toString(36).substring(7);
            const timestamp = Date.now();
            
            const response = await fetch('/api/interview-prep/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    numberOfQuestions: settings.numberOfQuestions,
                    topics: settings.topics,
                    randomSeed: randomSeed,
                    timestamp: timestamp,
                    // Add user-specific data to ensure uniqueness
                    sessionId: `${timestamp}-${randomSeed}`
                })
            });
            
            if (!response.ok) throw new Error('Failed to generate questions');
            
            const data = await response.json();
            setQuestions(data.questions);
            setCurrentQuestionIndex(0);
            setCurrentAnswer("");
            setStage('interview');
            
        } catch (error) {
            console.error('Question generation error:', error);
            toast({
                title: "Error",
                description: "Failed to generate questions. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
            {/* Exit Button - Only show if onExit is provided */}
            {onExit && (
                <div className="absolute top-4 right-4 z-50">
                    <Button
                        onClick={onExit}
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            )}

            <div className="container mx-auto p-4 h-screen flex flex-col max-w-[1400px]">
                <AnimatePresence mode="wait">
                    {stage === 'setup' && (
                        <motion.div
                            key="setup"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-3xl mx-auto flex-1 flex items-center justify-center"
                        >
                            <Card className="bg-slate-800/50 border-slate-700/50 w-full">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center justify-center text-2xl">
                                        <Sparkles className="w-6 h-6 mr-2 text-purple-400" />
                                        Interview Setup
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Number of Questions */}
                                    <div className="space-y-2">
                                        <Label className="text-white">Number of Questions</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={settings.numberOfQuestions}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                numberOfQuestions: parseInt(e.target.value) || 5
                                            })}
                                            className="bg-slate-900/50 border-slate-600 text-white"
                                        />
                                    </div>

                                    {/* Topics Selection */}
                                    <div className="space-y-3">
                                        <Label className="text-white">Select Topics</Label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {AVAILABLE_TOPICS.map((topic) => (
                                                <div
                                                    key={topic.id}
                                                    className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/30 cursor-pointer hover:bg-slate-700/50 transition-colors"
                                                    onClick={() => {
                                                        const newTopics = settings.topics.includes(topic.id)
                                                            ? settings.topics.filter(t => t !== topic.id)
                                                            : [...settings.topics, topic.id];
                                                        setSettings({ ...settings, topics: newTopics });
                                                    }}
                                                >
                                                    <Checkbox
                                                        checked={settings.topics.includes(topic.id)}
                                                        onCheckedChange={() => {}}
                                                    />
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <div className={`w-3 h-3 rounded-full ${topic.color}`} />
                                                        <span className="text-sm text-white">{topic.label}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Features - Only Speech-to-Text */}
                                    <div className="space-y-3">
                                        <Label className="text-white">Interview Features</Label>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                                                <span className="text-sm text-white">Enable Speech-to-Text</span>
                                                <Checkbox
                                                    checked={settings.enableSTT}
                                                    onCheckedChange={(checked: boolean) =>
                                                        setSettings({ ...settings, enableSTT: checked })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Start Button */}
                                    <Button
                                        onClick={startInterview}
                                        disabled={settings.topics.length === 0 || loading}
                                        className="w-full bg-purple-600 hover:bg-purple-700 py-3 text-lg"
                                    >
                                        {loading ? 'Generating Questions...' : 'Start Interview'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {stage === 'interview' && (
                        <motion.div
                            key="interview"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col"
                        >
                            {/* Progress Header */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h1 className="text-xl md:text-2xl font-bold text-white">
                                        Question {currentQuestionIndex + 1} of {questions.length}
                                    </h1>
                                    <div className="text-sm text-slate-400">
                                        {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete
                                    </div>
                                </div>
                                <Progress 
                                    value={((currentQuestionIndex + 1) / questions.length) * 100} 
                                    className="h-2 bg-slate-800"
                                />
                            </div>

                            {/* Main Content - Mobile-First Responsive */}
                            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-6 min-h-0">
                                {/* Question Section */}
                                <div className="flex flex-col min-h-[200px] lg:min-h-0">
                                    <Card className="bg-slate-800/50 border-slate-700/50 flex-1 flex flex-col">
                                        <CardHeader className="pb-3">
                                            <div className="flex gap-2 flex-wrap mb-2">
                                                <Badge variant="outline" className={`text-xs ${
                                                    questions[currentQuestionIndex].difficulty === 'Easy' && 'border-green-500 text-green-400'
                                                } ${
                                                    questions[currentQuestionIndex].difficulty === 'Medium' && 'border-yellow-500 text-yellow-400'
                                                } ${
                                                    questions[currentQuestionIndex].difficulty === 'Hard' && 'border-red-500 text-red-400'
                                                }`}>
                                                    {questions[currentQuestionIndex].difficulty}
                                                </Badge>
                                                <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">
                                                    {AVAILABLE_TOPICS.find(t => t.id === questions[currentQuestionIndex].topic)?.label}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-1 overflow-hidden pt-0">
                                            <ScrollArea className="h-full">
                                                <div className="pr-4">
                                                    <h2 className="text-base lg:text-lg text-white leading-relaxed whitespace-pre-wrap">
                                                        {questions[currentQuestionIndex].question}
                                                    </h2>
                                                </div>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Answer Section */}
                                <div className="flex flex-col flex-1 lg:min-h-0">
                                    <Card className="bg-slate-800/50 border-slate-700/50 flex-1 flex flex-col">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-white flex items-center text-lg">
                                                <Brain className="w-5 h-5 mr-2" />
                                                Your Answer
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-1 flex flex-col space-y-3 pt-0">
                                            <Textarea
                                                value={currentAnswer}
                                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                                placeholder="Type your answer here..."
                                                className="flex-1 min-h-[150px] lg:min-h-[200px] bg-slate-900/50 border-slate-600 text-white resize-none"
                                            />

                                            {/* Recording Controls */}
                                            {settings.enableSTT && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Button
                                                        onClick={toggleRecording}
                                                        variant={isRecording ? "destructive" : "outline"}
                                                        size="sm"
                                                        className="flex-shrink-0"
                                                    >
                                                        {isRecording ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
                                                        <span className="hidden sm:inline">
                                                            {isRecording ? 'Stop' : 'Voice'}
                                                        </span>
                                                    </Button>
                                                    <span className="text-slate-400 text-xs">
                                                        {currentAnswer.length} chars
                                                    </span>
                                                </div>
                                            )}

                                            {/* Action Buttons - Mobile Optimized */}
                                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                                <Button
                                                    onClick={submitAnswer}
                                                    disabled={loading || !currentAnswer.trim()}
                                                    className="flex-1 bg-purple-600 hover:bg-purple-700 py-2 sm:py-3"
                                                >
                                                    {loading ? 'Evaluating...' : 'Submit Answer'}
                                                </Button>
                                                <Button
                                                    onClick={skipQuestion}
                                                    variant="outline"
                                                    className="w-full sm:w-auto sm:px-6 py-2 sm:py-3"
                                                >
                                                    <SkipForward className="w-4 h-4 mr-2" />
                                                    Skip Question
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* Immediate Feedback Overlay */}
                            <AnimatePresence>
                                {showFeedback && questions[currentQuestionIndex].score !== undefined && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 50 }}
                                        className="fixed bottom-4 left-4 right-4 z-50"
                                    >
                                        <Card className="bg-slate-800 border-purple-500 max-w-lg mx-auto shadow-2xl">
                                            <CardContent className="p-4 sm:p-6">
                                                <div className="flex items-center gap-3 sm:gap-4">
                                                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center ${
                                                        (questions[currentQuestionIndex].score || 0) >= 70 
                                                            ? 'bg-green-500/20 text-green-400' 
                                                            : 'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                        <span className="text-lg sm:text-xl font-bold">
                                                            {questions[currentQuestionIndex].score}%
                                                        </span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-white font-medium text-base sm:text-lg">Answer Submitted!</p>
                                                        <p className="text-sm text-slate-400 mt-1">
                                                            {questions[currentQuestionIndex].feedback?.[0] || 'Good effort!'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {stage === 'results' && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 h-full"
                        >
                            <div className="h-full overflow-y-auto">
                                <div className="max-w-5xl mx-auto space-y-6 py-6 min-h-full">
                                    {/* Results Header */}
                                    <Card className="bg-slate-800/50 border-slate-700/50">
                                        <CardHeader className="text-center py-6 sm:py-8">
                                            <CardTitle className="text-white flex items-center justify-center text-2xl sm:text-3xl mb-4">
                                                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400 mr-3" />
                                                Interview Complete!
                                            </CardTitle>
                                            <div className="text-5xl sm:text-7xl font-bold text-purple-400 my-4 sm:my-6">
                                                {calculateOverallScore()}%
                                            </div>
                                            <p className="text-lg sm:text-xl text-slate-400">Overall Score</p>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-6 sm:mt-8">
                                                <Button
                                                    onClick={() => {
                                                        // Simple PDF generation fallback
                                                        const printContent = `
                                                            Interview Results
                                                            Overall Score: ${calculateOverallScore()}%
                                                            
                                                            ${questions.map((q, i) => `
                                                                Q${i + 1}: ${q.question}
                                                                Answer: ${q.userAnswer || 'No answer'}
                                                                Score: ${q.score || 0}%
                                                                ${q.feedback ? `Feedback: ${q.feedback.join(', ')}` : ''}
                                                            `).join('\n')}
                                                        `;
                                                        
                                                        const blob = new Blob([printContent], { type: 'text/plain' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `interview-results-${new Date().toISOString().split('T')[0]}.txt`;
                                                        a.click();
                                                        URL.revokeObjectURL(url);
                                                        
                                                        toast({
                                                            title: "Results Downloaded",
                                                            description: "Your interview results have been downloaded as a text file.",
                                                        });
                                                    }}
                                                    disabled={isGeneratingPDF}
                                                    className="bg-purple-600 hover:bg-purple-700 px-6 sm:px-8 py-3"
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download Results
                                                </Button>
                                            </div>
                                        </CardHeader>
                                    </Card>

                                    {/* Summary Statistics */}
                                    <Card className="bg-slate-800/50 border-slate-700/50">
                                        <CardHeader>
                                            <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                                                <Target className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                                                Performance Summary
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-3 gap-3 sm:gap-6">
                                                <div className="text-center p-3 sm:p-6 bg-slate-900/50 rounded-lg">
                                                    <div className="text-xl sm:text-3xl font-bold text-green-400">
                                                        {questions.filter(q => q.score && q.score >= 70).length}
                                                    </div>
                                                    <p className="text-slate-400 mt-1 sm:mt-2 text-xs sm:text-sm">Excellent</p>
                                                </div>
                                                <div className="text-center p-3 sm:p-6 bg-slate-900/50 rounded-lg">
                                                    <div className="text-xl sm:text-3xl font-bold text-yellow-400">
                                                        {questions.filter(q => q.score && q.score >= 50 && q.score < 70).length}
                                                    </div>
                                                    <p className="text-slate-400 mt-1 sm:mt-2 text-xs sm:text-sm">Good</p>
                                                </div>
                                                <div className="text-center p-3 sm:p-6 bg-slate-900/50 rounded-lg">
                                                    <div className="text-xl sm:text-3xl font-bold text-red-400">
                                                        {questions.filter(q => q.score && q.score < 50).length}
                                                    </div>
                                                    <p className="text-slate-400 mt-1 sm:mt-2 text-xs sm:text-sm">Needs Work</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Detailed Results */}
                                    <Card className="bg-slate-800/50 border-slate-700/50">
                                        <CardHeader>
                                            <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                                                <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                                                Question Details
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4 sm:space-y-6">
                                                {questions.map((question, index) => (
                                                    <div key={question.id} className="p-4 sm:p-6 rounded-lg bg-slate-900/50 space-y-3 sm:space-y-4">
                                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                                            <div className="flex-1">
                                                                <h3 className="font-medium text-white mb-2 sm:mb-3 text-base sm:text-lg leading-relaxed">
                                                                    Q{index + 1}: {question.question}
                                                                </h3>
                                                                <div className="flex gap-2 mb-3 flex-wrap">
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {question.topic}
                                                                    </Badge>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {question.difficulty}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            {question.score !== undefined && (
                                                                <div className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-sm font-medium flex-shrink-0 ${
                                                                    question.score >= 70 
                                                                        ? 'bg-green-500/20 text-green-400' 
                                                                        : question.score >= 50
                                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                                        : 'bg-red-500/20 text-red-400'
                                                                }`}>
                                                                    {question.score}%
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {question.userAnswer && (
                                                            <div>
                                                                <p className="text-sm text-slate-400 mb-2">Your Answer:</p>
                                                                <p className="text-sm text-slate-200 bg-slate-800/50 p-3 sm:p-4 rounded leading-relaxed">
                                                                    {question.userAnswer}
                                                                </p>
                                                            </div>
                                                        )}
                                                        
                                                        {question.feedback && question.feedback.length > 0 && (
                                                            <div>
                                                                <p className="text-sm text-slate-400 mb-2">Feedback:</p>
                                                                <ul className="list-disc list-inside space-y-1">
                                                                    {question.feedback.map((fb, fbIndex) => (
                                                                        <li key={fbIndex} className="text-sm text-slate-300 leading-relaxed">
                                                                            {fb}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Restart Button */}
                                    <Card className="bg-slate-800/50 border-slate-700/50">
                                        <CardContent className="p-6 sm:p-8 text-center">
                                            <Button
                                                onClick={() => {
                                                    setStage('setup');
                                                    setQuestions([]);
                                                    setCurrentQuestionIndex(0);
                                                    setCurrentAnswer("");
                                                    setShowFeedback(false);
                                                }}
                                                className="bg-purple-600 hover:bg-purple-700 px-6 sm:px-8 py-3 text-base sm:text-lg"
                                            >
                                                Start New Interview
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};