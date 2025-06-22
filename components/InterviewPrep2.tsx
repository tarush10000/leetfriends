// components/InterviewPrep.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mic,
    MicOff,
    Play,
    Pause,
    SkipForward,
    Volume2,
    VolumeX,
    ChevronRight,
    Trophy,
    Clock,
    Target,
    Brain,
    Sparkles,
    CheckCircle,
    AlertCircle
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
    enableTTS: boolean;
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
        enableTTS: true,
        enableSTT: true,
        showConfidence: true
    });

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [speechRecognition, setSpeechRecognition] = useState<any>(null);
    const [ttsEnabled, setTtsEnabled] = useState(true);

    const { toast } = useToast();

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                setCurrentAnswer(prev => prev + finalTranscript);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                toast({
                    title: "Speech Recognition Error",
                    description: "Please check your microphone permissions",
                    variant: "destructive"
                });
            };

            setSpeechRecognition(recognition);
        }
    }, [toast]);

    // Start Interview
    const startInterview = async () => {
        if (settings.topics.length === 0) {
            toast({
                title: "Select Topics",
                description: "Please select at least one topic",
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

            // Play first question if TTS is enabled
            if (settings.enableTTS && data.questions.length > 0) {
                playQuestion(data.questions[0].question);
            }
        } catch (error) {
            console.error('Error:', error);
            toast({
                title: "Error",
                description: "Failed to generate questions. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Text-to-Speech using Gemini
    const playQuestion = async (text: string) => {
        if (!ttsEnabled || !settings.enableTTS) return;

        setIsPlaying(true);
        try {
            const response = await fetch('/api/interview-prep/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) throw new Error('TTS failed');

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();
        } catch (error) {
            console.error('TTS error:', error);
            setIsPlaying(false);
        }
    };

    // Start/Stop Recording
    const toggleRecording = () => {
        if (!speechRecognition) {
            toast({
                title: "Not Supported",
                description: "Speech recognition is not supported in your browser",
                variant: "destructive"
            });
            return;
        }

        if (isRecording) {
            speechRecognition.stop();
            setIsRecording(false);
        } else {
            speechRecognition.start();
            setIsRecording(true);
        }
    };

    // Submit Answer
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

            // Move to next question or finish
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setCurrentAnswer("");

                // Play next question if TTS enabled
                if (settings.enableTTS) {
                    playQuestion(updatedQuestions[currentQuestionIndex + 1].question);
                }
            } else {
                // Interview completed
                setStage('results');
            }
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

    // Skip Question
    const skipQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setCurrentAnswer("");

            if (settings.enableTTS) {
                playQuestion(questions[currentQuestionIndex + 1].question);
            }
        } else {
            setStage('results');
        }
    };

    // Calculate overall score
    const calculateOverallScore = () => {
        const answeredQuestions = questions.filter(q => q.score !== undefined);
        if (answeredQuestions.length === 0) return 0;

        const totalScore = answeredQuestions.reduce((sum, q) => sum + (q.score || 0), 0);
        return Math.round(totalScore / answeredQuestions.length);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-4">
            <AnimatePresence mode="wait">
                {stage === 'setup' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-2xl mx-auto pt-20"
                    >
                        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    <Brain className="w-6 h-6 text-purple-400" />
                                    Interview Preparation Setup
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Number of Questions */}
                                <div className="space-y-2">
                                    <Label>Number of Questions</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={settings.numberOfQuestions}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            numberOfQuestions: parseInt(e.target.value) || 5
                                        })}
                                        className="bg-slate-800/50 border-slate-700"
                                    />
                                </div>

                                {/* Topic Selection */}
                                <div className="space-y-3">
                                    <Label>Select Topics</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {AVAILABLE_TOPICS.map(topic => (
                                            <div
                                                key={topic.id}
                                                className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer"
                                                onClick={() => {
                                                    const newTopics = settings.topics.includes(topic.id)
                                                        ? settings.topics.filter(t => t !== topic.id)
                                                        : [...settings.topics, topic.id];
                                                    setSettings({ ...settings, topics: newTopics });
                                                }}
                                            >
                                                <Checkbox
                                                    checked={settings.topics.includes(topic.id)}
                                                    onCheckedChange={() => { }}
                                                />
                                                <div className="flex items-center gap-2 flex-1">
                                                    <div className={`w-3 h-3 rounded-full ${topic.color}`} />
                                                    <span className="text-sm">{topic.label}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="space-y-3">
                                    <Label>Interview Features</Label>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                                            <span className="text-sm">Enable Text-to-Speech</span>
                                            <Checkbox
                                                checked={settings.enableTTS}
                                                onCheckedChange={(checked: boolean) =>
                                                    setSettings({ ...settings, enableTTS: checked })
                                                }
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                                            <span className="text-sm">Enable Speech-to-Text</span>
                                            <Checkbox
                                                checked={settings.enableSTT}
                                                onCheckedChange={(checked: boolean) =>
                                                    setSettings({ ...settings, enableSTT: checked as boolean })
                                                }
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                                            <span className="text-sm">Show Confidence Analysis</span>
                                            <Checkbox
                                                checked={settings.showConfidence}
                                                onCheckedChange={(checked: boolean) =>
                                                    setSettings({ ...settings, showConfidence: checked as boolean })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={startInterview}
                                        disabled={loading || settings.topics.length === 0}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                Generating Questions...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-4 h-4 mr-2" />
                                                Start Interview
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={onExit}
                                        variant="outline"
                                        className="border-slate-700 hover:bg-slate-800"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {stage === 'interview' && questions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-4xl mx-auto pt-10"
                    >
                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-400">
                                    Question {currentQuestionIndex + 1} of {questions.length}
                                </span>
                                <span className="text-sm text-slate-400">
                                    {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete
                                </span>
                            </div>
                            <Progress
                                value={((currentQuestionIndex + 1) / questions.length) * 100}
                                className="h-2 bg-slate-800"
                            />
                        </div>

                        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className={`
                                                    ${questions[currentQuestionIndex].difficulty === 'Easy' && 'border-green-500 text-green-400'}
                                                    ${questions[currentQuestionIndex].difficulty === 'Medium' && 'border-yellow-500 text-yellow-400'}
                                                    ${questions[currentQuestionIndex].difficulty === 'Hard' && 'border-red-500 text-red-400'}
                                                `}
                                            >
                                                {questions[currentQuestionIndex].difficulty}
                                            </Badge>
                                            <Badge variant="outline" className="border-purple-500 text-purple-400">
                                                {AVAILABLE_TOPICS.find(t => t.id === questions[currentQuestionIndex].topic)?.label}
                                            </Badge>
                                        </div>
                                        <h2 className="text-xl font-semibold">
                                            {questions[currentQuestionIndex].question}
                                        </h2>
                                    </div>

                                    {/* Audio Controls */}
                                    {settings.enableTTS && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setTtsEnabled(!ttsEnabled)}
                                                className="hover:bg-slate-800"
                                            >
                                                {ttsEnabled ? (
                                                    <Volume2 className="w-4 h-4" />
                                                ) : (
                                                    <VolumeX className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => playQuestion(questions[currentQuestionIndex].question)}
                                                disabled={isPlaying}
                                                className="hover:bg-slate-800"
                                            >
                                                {isPlaying ? (
                                                    <Pause className="w-4 h-4" />
                                                ) : (
                                                    <Play className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Answer Input */}
                                <div className="space-y-2">
                                    <Label>Your Answer</Label>
                                    <Textarea
                                        value={currentAnswer}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCurrentAnswer(e.target.value)}
                                        placeholder="Type your answer here or use the microphone to record..."
                                        className="min-h-[200px] bg-slate-800/50 border-slate-700"
                                    />
                                </div>

                                {/* Recording Controls */}
                                {settings.enableSTT && speechRecognition && (
                                    <div className="flex items-center justify-center">
                                        <Button
                                            size="lg"
                                            variant={isRecording ? "destructive" : "secondary"}
                                            onClick={toggleRecording}
                                            className="rounded-full"
                                        >
                                            {isRecording ? (
                                                <>
                                                    <MicOff className="w-5 h-5 mr-2" />
                                                    Stop Recording
                                                </>
                                            ) : (
                                                <>
                                                    <Mic className="w-5 h-5 mr-2" />
                                                    Start Recording
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={submitAnswer}
                                        disabled={loading || !currentAnswer.trim()}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                Evaluating...
                                            </>
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
                                        className="border-slate-700 hover:bg-slate-800"
                                    >
                                        <SkipForward className="w-4 h-4 mr-2" />
                                        Skip Question
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {stage === 'results' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-4xl mx-auto pt-10"
                    >
                        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    <Trophy className="w-6 h-6 text-yellow-400" />
                                    Interview Results
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Overall Score */}
                                <div className="text-center py-6">
                                    <div className="text-6xl font-bold text-purple-400 mb-2">
                                        {calculateOverallScore()}%
                                    </div>
                                    <p className="text-lg text-slate-400">Overall Score</p>
                                </div>

                                {/* Questions Summary */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Question Summary</h3>
                                    {questions.map((question, index) => (
                                        <div
                                            key={question.id}
                                            className="p-4 rounded-lg bg-slate-800/30 space-y-3"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="font-medium">{question.question}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {question.topic}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {question.difficulty}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {question.score !== undefined && (
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-purple-400">
                                                            {question.score}%
                                                        </div>
                                                        <p className="text-xs text-slate-400">Score</p>
                                                    </div>
                                                )}
                                            </div>

                                            {question.userAnswer && (
                                                <div className="pt-3 border-t border-slate-700">
                                                    <p className="text-sm text-slate-400 mb-2">Your Answer:</p>
                                                    <p className="text-sm">{question.userAnswer}</p>
                                                </div>
                                            )}

                                            {question.expectedPoints && (
                                                <div className="pt-3 border-t border-slate-700">
                                                    <p className="text-sm text-slate-400 mb-2">Expected Points:</p>
                                                    <ul className="space-y-1">
                                                        {question.expectedPoints.map((point, i) => (
                                                            <li key={i} className="text-sm flex items-start gap-2">
                                                                <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                                                                <span>{point}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {question.feedback && question.feedback.length > 0 && (
                                                <div className="pt-3 border-t border-slate-700">
                                                    <p className="text-sm text-slate-400 mb-2">Improvement Suggestions:</p>
                                                    <ul className="space-y-1">
                                                        {question.feedback.map((feedback, i) => (
                                                            <li key={i} className="text-sm flex items-start gap-2">
                                                                <Sparkles className="w-3 h-3 text-yellow-400 mt-0.5 shrink-0" />
                                                                <span>{feedback}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex gap-3 pt-4">
                                                <Button
                                                    onClick={() => {
                                                        setStage('setup');
                                                        setQuestions([]);
                                                        setCurrentQuestionIndex(0);
                                                        setCurrentAnswer("");
                                                    }}
                                                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                                                >
                                                    <Brain className="w-4 h-4 mr-2" />
                                                    Practice Again
                                                </Button>
                                                <Button
                                                    onClick={onExit}
                                                    variant="outline"
                                                    className="flex-1 border-slate-700 hover:bg-slate-800"
                                                >
                                                    Back to Dashboard
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}