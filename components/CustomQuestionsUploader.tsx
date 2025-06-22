// components/CustomQuestionsUploader.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Trash2, Eye, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CustomQuestion {
    id: string;
    question: string;
    topic: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    expectedPoints: string[];
    context?: string;
    source?: string;
}

interface CustomQuestionsData {
    questions: CustomQuestion[];
    metadata: {
        source: string;
        lastUpdated: string;
        totalQuestions: number;
        topics: string[];
    };
}

interface CustomQuestionsUploaderProps {
    onClose?: () => void;
}

export default function CustomQuestionsUploader({ onClose }: CustomQuestionsUploaderProps) {
    const [uploadedFiles, setUploadedFiles] = useState<CustomQuestionsData[]>([]);
    const [loading, setLoading] = useState(false);
    const [newQuestionForm, setNewQuestionForm] = useState<Partial<CustomQuestion>>({
        question: '',
        topic: 'oop',
        difficulty: 'Medium',
        expectedPoints: [''],
        context: '',
        source: 'manual'
    });
    const [showManualForm, setShowManualForm] = useState(false);

    const { toast } = useToast();

    // Load existing custom questions
    const loadCustomQuestions = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/interview-prep/custom-questions');
            if (response.ok) {
                const data = await response.json();
                setUploadedFiles(data.customQuestions || []);
            }
        } catch (error) {
            console.error('Error loading custom questions:', error);
            toast({
                title: "Error",
                description: "Failed to load existing questions",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle JSON file upload
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            toast({
                title: "Invalid File Type",
                description: "Please upload a JSON file",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const fileContent = await file.text();
            const jsonData = JSON.parse(fileContent);

            // Validate the JSON structure
            if (!jsonData.questions || !Array.isArray(jsonData.questions)) {
                throw new Error("Invalid JSON structure. Expected 'questions' array.");
            }

            // Send to API
            const response = await fetch('/api/interview-prep/custom-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questions: jsonData.questions,
                    metadata: {
                        source: jsonData.metadata?.source || file.name.replace('.json', ''),
                        description: jsonData.metadata?.description || '',
                        ...jsonData.metadata
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            toast({
                title: "Upload Successful",
                description: `Added ${jsonData.questions.length} questions from ${file.name}`,
            });

            // Reload the list
            await loadCustomQuestions();

        } catch (error) {
            console.error('Upload error:', error);
            toast({
                title: "Upload Failed",
                description: error instanceof Error ? error.message : "Failed to parse JSON file",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
            event.target.value = '';
        }
    };

    // Add manual question
    const addManualQuestion = async () => {
        if (!newQuestionForm.question || !newQuestionForm.expectedPoints?.[0]) {
            toast({
                title: "Validation Error",
                description: "Please fill in question and at least one expected point",
                variant: "destructive"
            });
            return;
        }

        const question: CustomQuestion = {
            id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            question: newQuestionForm.question!,
            topic: newQuestionForm.topic!,
            difficulty: newQuestionForm.difficulty!,
            expectedPoints: newQuestionForm.expectedPoints!.filter(point => point.trim()),
            context: newQuestionForm.context,
            source: 'manual'
        };

        setLoading(true);
        try {
            const response = await fetch('/api/interview-prep/custom-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questions: [question],
                    metadata: {
                        source: 'manual-entry',
                        description: 'Manually added questions'
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add question');
            }

            toast({
                title: "Question Added",
                description: "Your custom question has been added successfully",
            });

            // Reset form
            setNewQuestionForm({
                question: '',
                topic: 'oop',
                difficulty: 'Medium',
                expectedPoints: [''],
                context: '',
                source: 'manual'
            });
            setShowManualForm(false);

            // Reload the list
            await loadCustomQuestions();

        } catch (error) {
            console.error('Error adding question:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add question",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Delete custom questions source
    const deleteSource = async (source: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/interview-prep/custom-questions?source=${encodeURIComponent(source)}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Delete failed');
            }

            toast({
                title: "Deleted Successfully",
                description: `Removed all questions from source: ${source}`,
            });

            await loadCustomQuestions();

        } catch (error) {
            console.error('Delete error:', error);
            toast({
                title: "Delete Failed",
                description: error instanceof Error ? error.message : "Failed to delete questions",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Download sample JSON format
    const downloadSampleFormat = () => {
        const sampleData = {
            questions: [
                {
                    id: "sample_1",
                    question: "Explain the concept of inheritance in object-oriented programming",
                    topic: "oop",
                    difficulty: "Medium",
                    expectedPoints: [
                        "Define inheritance as deriving new classes from existing ones",
                        "Explain parent class and child class relationship",
                        "Mention code reusability benefits",
                        "Discuss method overriding"
                    ],
                    context: "This question tests understanding of OOP fundamentals",
                    source: "your-source-name"
                },
                {
                    id: "sample_2",
                    question: "What is a deadlock in operating systems and how can it be prevented?",
                    topic: "os",
                    difficulty: "Hard",
                    expectedPoints: [
                        "Define deadlock as circular waiting for resources",
                        "Explain the four necessary conditions",
                        "Discuss prevention strategies (resource ordering, etc.)",
                        "Mention detection and recovery methods"
                    ],
                    context: "Tests knowledge of process synchronization",
                    source: "your-source-name"
                }
            ],
            metadata: {
                source: "your-source-name",
                description: "Sample questions for interview preparation",
                topics: ["oop", "os", "dbms", "networks"],
                difficulty_levels: ["Easy", "Medium", "Hard"]
            }
        };

        const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample-questions-format.json';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    // Initialize on mount
    useState(() => {
        loadCustomQuestions();
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-4">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Custom Questions Manager</h1>
                        <p className="text-slate-400">Upload and manage your own interview questions</p>
                    </div>
                    {onClose && (
                        <Button onClick={onClose} variant="outline">
                            Close
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upload Section */}
                    <Card className="bg-slate-800/50 border-slate-700/50">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center">
                                <Upload className="w-5 h-5 mr-2" />
                                Upload Questions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* File Upload */}
                            <div>
                                <Label className="text-white">Upload JSON File</Label>
                                <Input
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileUpload}
                                    disabled={loading}
                                    className="bg-slate-900/50 border-slate-600 text-white file:bg-purple-600 file:text-white file:border-none"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    Upload a JSON file with questions and answers
                                </p>
                            </div>

                            {/* Sample Format */}
                            <Button
                                onClick={downloadSampleFormat}
                                variant="outline"
                                size="sm"
                                className="w-full"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download Sample Format
                            </Button>

                            {/* Manual Question Entry */}
                            <Button
                                onClick={() => setShowManualForm(!showManualForm)}
                                variant="outline"
                                className="w-full"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Question Manually
                            </Button>

                            {/* Manual Form */}
                            {showManualForm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-4 p-4 bg-slate-900/50 rounded-lg"
                                >
                                    <div>
                                        <Label className="text-white">Question</Label>
                                        <Textarea
                                            value={newQuestionForm.question}
                                            onChange={(e) => setNewQuestionForm({
                                                ...newQuestionForm,
                                                question: e.target.value
                                            })}
                                            placeholder="Enter your interview question..."
                                            className="bg-slate-800 border-slate-600 text-white"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-white">Topic</Label>
                                            <select
                                                value={newQuestionForm.topic}
                                                onChange={(e) => setNewQuestionForm({
                                                    ...newQuestionForm,
                                                    topic: e.target.value
                                                })}
                                                className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white"
                                            >
                                                <option value="oop">OOP</option>
                                                <option value="os">Operating Systems</option>
                                                <option value="dbms">Database Management</option>
                                                <option value="networks">Computer Networks</option>
                                            </select>
                                        </div>

                                        <div>
                                            <Label className="text-white">Difficulty</Label>
                                            <select
                                                value={newQuestionForm.difficulty}
                                                onChange={(e) => setNewQuestionForm({
                                                    ...newQuestionForm,
                                                    difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard'
                                                })}
                                                className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white"
                                            >
                                                <option value="Easy">Easy</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Hard">Hard</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-white">Expected Points</Label>
                                        {newQuestionForm.expectedPoints?.map((point, index) => (
                                            <div key={index} className="flex gap-2 mt-2">
                                                <Input
                                                    value={point}
                                                    onChange={(e) => {
                                                        const newPoints = [...(newQuestionForm.expectedPoints || [])];
                                                        newPoints[index] = e.target.value;
                                                        setNewQuestionForm({
                                                            ...newQuestionForm,
                                                            expectedPoints: newPoints
                                                        });
                                                    }}
                                                    placeholder="Expected answer point..."
                                                    className="bg-slate-800 border-slate-600 text-white"
                                                />
                                                {index === (newQuestionForm.expectedPoints?.length || 1) - 1 && (
                                                    <Button
                                                        onClick={() => setNewQuestionForm({
                                                            ...newQuestionForm,
                                                            expectedPoints: [...(newQuestionForm.expectedPoints || []), '']
                                                        })}
                                                        size="icon"
                                                        variant="outline"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div>
                                        <Label className="text-white">Context (Optional)</Label>
                                        <Input
                                            value={newQuestionForm.context}
                                            onChange={(e) => setNewQuestionForm({
                                                ...newQuestionForm,
                                                context: e.target.value
                                            })}
                                            placeholder="Additional context for the question..."
                                            className="bg-slate-800 border-slate-600 text-white"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={addManualQuestion}
                                            disabled={loading}
                                            className="bg-purple-600 hover:bg-purple-700"
                                        >
                                            Add Question
                                        </Button>
                                        <Button
                                            onClick={() => setShowManualForm(false)}
                                            variant="outline"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Existing Questions */}
                    <Card className="bg-slate-800/50 border-slate-700/50">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center">
                                <FileText className="w-5 h-5 mr-2" />
                                Uploaded Questions ({uploadedFiles.reduce((sum, file) => sum + file.questions.length, 0)})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96">
                                {uploadedFiles.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-slate-400">No custom questions uploaded yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {uploadedFiles.map((file, index) => (
                                            <div key={index} className="p-4 bg-slate-900/50 rounded-lg">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-medium text-white">{file.metadata.source}</h3>
                                                        <p className="text-sm text-slate-400">
                                                            {file.questions.length} questions
                                                        </p>
                                                    </div>
                                                    <Button
                                                        onClick={() => deleteSource(file.metadata.source)}
                                                        size="icon"
                                                        variant="ghost"
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {file.metadata.topics.map(topic => (
                                                        <Badge key={topic} variant="outline" className="text-xs">
                                                            {topic}
                                                        </Badge>
                                                    ))}
                                                </div>

                                                <p className="text-xs text-slate-500">
                                                    Last updated: {new Date(file.metadata.lastUpdated).toLocaleDateString()}
                                                </p>

                                                {/* Preview first question */}
                                                {file.questions.length > 0 && (
                                                    <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs">
                                                        <p className="text-slate-400">Preview:</p>
                                                        <p className="text-slate-300 truncate">
                                                            {file.questions[0].question}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Instructions */}
                <Card className="mt-6 bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                        <CardTitle className="text-white">JSON Format Instructions</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-300 space-y-2 text-sm">
                        <p>Your JSON file should follow this structure:</p>
                        <pre className="bg-slate-900 p-3 rounded text-xs overflow-x-auto">
                            {`{
  "questions": [
    {
      "id": "unique_identifier",
      "question": "Your interview question",
      "topic": "oop|os|dbms|networks",
      "difficulty": "Easy|Medium|Hard",
      "expectedPoints": [
        "Key point 1",
        "Key point 2"
      ],
      "context": "Optional context",
      "source": "your-source-name"
    }
  ],
  "metadata": {
    "source": "your-source-name",
    "description": "Optional description"
  }
}`}
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}