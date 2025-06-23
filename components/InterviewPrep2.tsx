// components/InterviewPrep2.tsx - Enhanced with Show Answer functionality
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mic, MicOff, Play, Pause, SkipForward, Volume2, VolumeX,
    ChevronRight, Trophy, Clock, Target, Brain, Sparkles,
    CheckCircle, AlertCircle, Download, Share2, X, FileText,
    Eye, EyeOff, Lightbulb, BookOpen, HelpCircle, BarChart3
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
    const [showAnswer, setShowAnswer] = useState(false);

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
                    setShowAnswer(false); // Reset show answer for next question
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
                    difficulty: q.difficulty,
                    expectedPoints: q.expectedPoints // Include expected points in PDF
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
            setShowAnswer(false); // Reset show answer for next question
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
            const response = await fetch('/api/interview-prep/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    numberOfQuestions: settings.numberOfQuestions,
                    topics: settings.topics
                })
            });

            if (!response.ok) throw new Error('Failed to generate questions');

            const data = await response.json();
            setQuestions(data.questions);
            setStage('interview');
        } catch (error) {
            console.error('Error generating questions:', error);
            toast({
                title: "Error",
                description: "Failed to generate questions. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Get difficulty color
    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'text-green-400 bg-green-400/10 border-green-400/30';
            case 'Medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
            case 'Hard': return 'text-red-400 bg-red-400/10 border-red-400/30';
            default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
        }
    };

    // Get topic color
    const getTopicColor = (topic: string) => {
        const topicData = AVAILABLE_TOPICS.find(t => t.id === topic);
        return topicData?.color || 'bg-gray-500';
    };

    return (
        <div className="flex flex-col h-full">
            <AnimatePresence mode="wait">
                {stage === 'setup' && (
                    <motion.div
                        key="setup"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex items-center justify-center"
                    >
                        <Card className="bg-slate-800/50 border-slate-700/50 w-full max-w-md">
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
                                    {loading ? (
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Generating Questions...
                                        </div>
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5 mr-2" />
                                            Start Interview
                                        </>
                                    )}
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
                                <Card className="bg-slate-800/50 border-slate-700/50 h-full">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-white flex items-center">
                                                <Brain className="w-5 h-5 mr-2" />
                                                Question
                                            </CardTitle>
                                            <div className="flex items-center gap-2">
                                                <Badge className={getDifficultyColor(questions[currentQuestionIndex]?.difficulty)}>
                                                    {questions[currentQuestionIndex]?.difficulty}
                                                </Badge>
                                                <Badge className={`${getTopicColor(questions[currentQuestionIndex]?.topic)} text-white`}>
                                                    {AVAILABLE_TOPICS.find(t => t.id === questions[currentQuestionIndex]?.topic)?.label}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <ScrollArea className="h-full">
                                            <div className="space-y-4">
                                                <p className="text-slate-200 text-lg leading-relaxed">
                                                    {questions[currentQuestionIndex]?.question}
                                                </p>
                                                
                                                {/* Show Answer Section */}
                                                <div className="space-y-3">
                                                    <Button
                                                        onClick={() => setShowAnswer(!showAnswer)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                                                    >
                                                        {showAnswer ? (
                                                            <>
                                                                <EyeOff className="w-4 h-4 mr-2" />
                                                                Hide Answer
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                Show Answer
                                                            </>
                                                        )}
                                                    </Button>

                                                    <AnimatePresence>
                                                        {showAnswer && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: "auto" }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                transition={{ duration: 0.3 }}
                                                                className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
                                                            >
                                                                <div className="flex items-center mb-3">
                                                                    <Lightbulb className="w-5 h-5 text-blue-400 mr-2" />
                                                                    <h4 className="text-blue-400 font-semibold">Key Points to Cover:</h4>
                                                                </div>
                                                                <ul className="space-y-2 text-slate-300">
                                                                    {questions[currentQuestionIndex]?.expectedPoints.map((point, index) => (
                                                                        <li key={index} className="flex items-start">
                                                                            <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                                                                            <span className="text-sm">{point}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Answer Section */}
                            <div className="flex flex-col min-h-[300px] lg:min-h-0">
                                <Card className="bg-slate-800/50 border-slate-700/50 h-full">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-white flex items-center">
                                            <FileText className="w-5 h-5 mr-2" />
                                            Your Answer
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col space-y-4">
                                        {/* Answer Input */}
                                        <div className="flex-1">
                                            <Textarea
                                                placeholder="Type your answer here... You can also use voice input if enabled."
                                                value={currentAnswer}
                                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                                className="bg-slate-900/50 border-slate-600 text-white h-full min-h-[150px] resize-none"
                                            />
                                        </div>

                                        {/* Voice Input and Character Count */}
                                        {settings.enableSTT && (
                                            <div className="flex items-center justify-between">
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
                                                {loading ? (
                                                    <div className="flex items-center">
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                        Evaluating...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Submit Answer
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                onClick={skipQuestion}
                                                variant="outline"
                                                className="flex-1 sm:flex-none border-slate-600 text-slate-300 hover:text-white py-2 sm:py-3"
                                            >
                                                <SkipForward className="w-4 h-4 mr-2" />
                                                Skip
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Feedback Overlay */}
                        <AnimatePresence>
                            {showFeedback && questions[currentQuestionIndex]?.feedback && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 50 }}
                                    className="fixed bottom-4 left-4 right-4 z-50"
                                >
                                    <Card className="bg-slate-900/95 border-slate-700 backdrop-blur-sm">
                                        <CardContent className="p-4">
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0">
                                                    {questions[currentQuestionIndex]?.score! >= 70 ? (
                                                        <CheckCircle className="w-6 h-6 text-green-400" />
                                                    ) : questions[currentQuestionIndex]?.score! >= 50 ? (
                                                        <AlertCircle className="w-6 h-6 text-yellow-400" />
                                                    ) : (
                                                        <X className="w-6 h-6 text-red-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-white font-semibold mb-2">
                                                        Score: {questions[currentQuestionIndex]?.score}/100
                                                    </h4>
                                                    <ul className="text-slate-300 text-sm space-y-1">
                                                        {questions[currentQuestionIndex]?.feedback?.map((item, index) => (
                                                            <li key={index}>• {item}</li>
                                                        ))}
                                                    </ul>
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
                        exit={{ opacity: 0 }}
                        className="flex-1"
                    >
                        <div className="space-y-6">
                            {/* Results Header */}
                            <Card className="bg-slate-800/50 border-slate-700/50">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center justify-center text-2xl">
                                        <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
                                        Interview Complete!
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center space-y-4">
                                        <div className="text-4xl font-bold text-purple-400">
                                            {calculateOverallScore()}%
                                        </div>
                                        <p className="text-slate-300">Overall Score</p>
                                        
                                        {/* Score Breakdown */}
                                        <div className="grid grid-cols-3 gap-4 mt-6">
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

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                            <Button
                                                onClick={generatePDF}
                                                disabled={isGeneratingPDF}
                                                className="flex-1 bg-green-600 hover:bg-green-700"
                                            >
                                                {isGeneratingPDF ? (
                                                    <div className="flex items-center">
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                        Generating PDF...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Download className="w-4 h-4 mr-2" />
                                                        Download Results
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setStage('setup');
                                                    setCurrentQuestionIndex(0);
                                                    setQuestions([]);
                                                    setCurrentAnswer("");
                                                    setShowFeedback(false);
                                                    setShowAnswer(false);
                                                }}
                                                variant="outline"
                                                className="flex-1 border-slate-600 text-slate-300 hover:text-white"
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                New Interview
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Detailed Results */}
                            <Card className="bg-slate-800/50 border-slate-700/50">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center">
                                        <BarChart3 className="w-5 h-5 mr-2" />
                                        Question Breakdown
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-80">
                                        <div className="space-y-4">
                                            {questions.map((question, index) => (
                                                <div key={question.id} className="p-4 bg-slate-900/50 rounded-lg">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <h4 className="text-white font-medium mb-2">
                                                                Question {index + 1}
                                                            </h4>
                                                            <p className="text-slate-300 text-sm mb-3">
                                                                {question.question}
                                                            </p>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Badge className={getDifficultyColor(question.difficulty)}>
                                                                    {question.difficulty}
                                                                </Badge>
                                                                <Badge className={`${getTopicColor(question.topic)} text-white`}>
                                                                    {AVAILABLE_TOPICS.find(t => t.id === question.topic)?.label}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        {question.score !== undefined && (
                                                            <div className="text-right">
                                                                <div className={`text-2xl font-bold ${
                                                                    question.score >= 70 ? 'text-green-400' :
                                                                    question.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                                                                }`}>
                                                                    {question.score}
                                                                </div>
                                                                <div className="text-xs text-slate-400">out of 100</div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Expected Points */}
                                                    <div className="mb-3">
                                                        <div className="flex items-center mb-2">
                                                            <Lightbulb className="w-4 h-4 text-blue-400 mr-2" />
                                                            <span className="text-blue-400 text-sm font-medium">Expected Points:</span>
                                                        </div>
                                                        <ul className="text-slate-300 text-sm space-y-1 ml-6">
                                                            {question.expectedPoints.map((point, pointIndex) => (
                                                                <li key={pointIndex} className="flex items-start">
                                                                    <CheckCircle className="w-3 h-3 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                                                                    <span>{point}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    {/* User Answer */}
                                                    {question.userAnswer && (
                                                        <div className="mb-3">
                                                            <div className="flex items-center mb-2">
                                                                <FileText className="w-4 h-4 text-purple-400 mr-2" />
                                                                <span className="text-purple-400 text-sm font-medium">Your Answer:</span>
                                                            </div>
                                                            <p className="text-slate-300 text-sm bg-slate-800/50 p-3 rounded border-l-4 border-purple-400/50">
                                                                {question.userAnswer}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Feedback */}
                                                    {question.feedback && question.feedback.length > 0 && (
                                                        <div>
                                                            <div className="flex items-center mb-2">
                                                                <Target className="w-4 h-4 text-yellow-400 mr-2" />
                                                                <span className="text-yellow-400 text-sm font-medium">Feedback:</span>
                                                            </div>
                                                            <ul className="text-slate-300 text-sm space-y-1 ml-6">
                                                                {question.feedback.map((feedback, feedbackIndex) => (
                                                                    <li key={feedbackIndex} className="flex items-start">
                                                                        <AlertCircle className="w-3 h-3 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                                                                        <span>{feedback}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {!question.userAnswer && (
                                                        <div className="text-slate-500 text-sm italic">
                                                            Question was skipped
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}