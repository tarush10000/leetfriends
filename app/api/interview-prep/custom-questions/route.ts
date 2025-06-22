// app/api/interview-prep/custom-questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { promises as fs } from 'fs';
import path from 'path';

// Define the structure for custom question data
interface CustomQuestionData {
    questions: Array<{
        id: string;
        question: string;
        topic: string;
        difficulty: 'Easy' | 'Medium' | 'Hard';
        expectedPoints: string[];
        context?: string;
        source?: string;
    }>;
    metadata: {
        source: string;
        lastUpdated: string;
        totalQuestions: number;
        topics: string[];
    };
}

interface TopicContent {
    topic: string;
    content: string;
    keyPoints: string[];
    examples: string[];
    relatedQuestions: string[];
}

// Load custom questions from JSON file
async function loadCustomQuestions(source?: string): Promise<CustomQuestionData[]> {
    try {
        const dataDirectory = path.join(process.cwd(), 'data', 'custom-questions');
        
        // Create directory if it doesn't exist
        try {
            await fs.access(dataDirectory);
        } catch {
            await fs.mkdir(dataDirectory, { recursive: true });
            // Create sample file if directory was just created
            await createSampleData(dataDirectory);
        }

        // Read all JSON files in the directory
        const files = await fs.readdir(dataDirectory);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        if (jsonFiles.length === 0) {
            await createSampleData(dataDirectory);
            return await loadCustomQuestions(source);
        }

        const customQuestions: CustomQuestionData[] = [];

        for (const file of jsonFiles) {
            if (source && !file.includes(source)) continue;
            
            try {
                const filePath = path.join(dataDirectory, file);
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const data = JSON.parse(fileContent) as CustomQuestionData;
                
                // Validate data structure
                if (data.questions && Array.isArray(data.questions)) {
                    customQuestions.push(data);
                }
            } catch (error) {
                console.error(`Error reading file ${file}:`, error);
            }
        }

        return customQuestions;
    } catch (error) {
        console.error('Error loading custom questions:', error);
        return [];
    }
}

// Create sample data files
async function createSampleData(dataDirectory: string) {
    const sampleData: CustomQuestionData = {
        questions: [
            {
                id: "custom_oop_1",
                question: "Explain the concept of polymorphism in object-oriented programming with a real-world example.",
                topic: "oop",
                difficulty: "Medium",
                expectedPoints: [
                    "Define polymorphism as one interface, multiple implementations",
                    "Explain compile-time vs runtime polymorphism",
                    "Provide real-world example (e.g., animals making sounds)",
                    "Mention method overriding and overloading"
                ],
                context: "Polymorphism is a fundamental OOP concept that allows objects of different classes to be treated as objects of a common base class.",
                source: "custom"
            },
            {
                id: "custom_os_1",
                question: "What is the difference between a process and a thread? When would you use one over the other?",
                topic: "os",
                difficulty: "Hard",
                expectedPoints: [
                    "Process: independent memory space, higher overhead",
                    "Thread: shared memory space, lower overhead",
                    "Context switching differences",
                    "Use cases for each"
                ],
                context: "Understanding the distinction between processes and threads is crucial for system design and performance optimization.",
                source: "custom"
            }
        ],
        metadata: {
            source: "sample-questions",
            lastUpdated: new Date().toISOString(),
            totalQuestions: 2,
            topics: ["oop", "os"]
        }
    };

    const filePath = path.join(dataDirectory, 'sample-questions.json');
    await fs.writeFile(filePath, JSON.stringify(sampleData, null, 2));
}

// Load topic content from JSON files
async function loadTopicContent(): Promise<TopicContent[]> {
    try {
        const dataDirectory = path.join(process.cwd(), 'data', 'topic-content');
        
        try {
            await fs.access(dataDirectory);
        } catch {
            await fs.mkdir(dataDirectory, { recursive: true });
            await createSampleTopicContent(dataDirectory);
        }

        const files = await fs.readdir(dataDirectory);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        const topicContent: TopicContent[] = [];

        for (const file of jsonFiles) {
            try {
                const filePath = path.join(dataDirectory, file);
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const data = JSON.parse(fileContent) as TopicContent;
                topicContent.push(data);
            } catch (error) {
                console.error(`Error reading topic file ${file}:`, error);
            }
        }

        return topicContent;
    } catch (error) {
        console.error('Error loading topic content:', error);
        return [];
    }
}

// Create sample topic content
async function createSampleTopicContent(dataDirectory: string) {
    const sampleTopics: TopicContent[] = [
        {
            topic: "oop",
            content: "Object-oriented programming (OOP) is a programming paradigm based on the concept of objects, which can contain data and code. The four main principles are encapsulation, inheritance, polymorphism, and abstraction.",
            keyPoints: [
                "Encapsulation: bundling data and methods together",
                "Inheritance: creating new classes based on existing ones",
                "Polymorphism: one interface, multiple implementations", 
                "Abstraction: hiding complex implementation details"
            ],
            examples: [
                "Class and object creation",
                "Method overriding and overloading",
                "Interface implementation",
                "Abstract classes usage"
            ],
            relatedQuestions: [
                "What are the SOLID principles?",
                "Difference between abstract class and interface",
                "Explain design patterns you know"
            ]
        },
        {
            topic: "os",
            content: "Operating systems manage computer hardware and software resources, providing common services for computer programs. Key concepts include process management, memory management, file systems, and I/O operations.",
            keyPoints: [
                "Process scheduling and management",
                "Memory allocation and virtual memory",
                "File system organization",
                "Synchronization and deadlock prevention"
            ],
            examples: [
                "Round-robin scheduling",
                "Paging and segmentation",
                "Mutex and semaphores",
                "Producer-consumer problem"
            ],
            relatedQuestions: [
                "What is virtual memory?",
                "Explain different scheduling algorithms",
                "How do you prevent deadlocks?"
            ]
        }
    ];

    for (const topic of sampleTopics) {
        const filePath = path.join(dataDirectory, `${topic.topic}.json`);
        await fs.writeFile(filePath, JSON.stringify(topic, null, 2));
    }
}

// GET: Retrieve custom questions and topic content
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const source = searchParams.get('source');
        const topic = searchParams.get('topic');

        // Load custom questions
        const customQuestions = await loadCustomQuestions(source || undefined);
        
        // Load topic content
        const topicContent = await loadTopicContent();

        // Filter by topic if specified
        let filteredQuestions = customQuestions;
        if (topic) {
            filteredQuestions = customQuestions.map(data => ({
                ...data,
                questions: data.questions.filter(q => q.topic === topic)
            })).filter(data => data.questions.length > 0);
        }

        // Get available sources
        const availableSources = [...new Set(customQuestions.map(data => data.metadata.source))];
        
        // Get available topics
        const availableTopics = [...new Set(customQuestions.flatMap(data => data.questions.map(q => q.topic)))];

        return NextResponse.json({
            customQuestions: filteredQuestions,
            topicContent: topicContent.filter(content => !topic || content.topic === topic),
            metadata: {
                availableSources,
                availableTopics,
                totalQuestions: customQuestions.reduce((sum, data) => sum + data.questions.length, 0)
            }
        });

    } catch (error) {
        console.error('Error fetching custom questions:', error);
        return NextResponse.json({ 
            error: "Internal server error",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// POST: Add new custom questions from uploaded JSON
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { questions, metadata, overwrite = false } = body;

        if (!questions || !Array.isArray(questions) || !metadata) {
            return NextResponse.json({ 
                error: "Invalid data format. Expected questions array and metadata object." 
            }, { status: 400 });
        }

        // Validate question structure
        for (const question of questions) {
            if (!question.id || !question.question || !question.topic || !question.difficulty || !question.expectedPoints) {
                return NextResponse.json({ 
                    error: "Invalid question format. Each question must have id, question, topic, difficulty, and expectedPoints." 
                }, { status: 400 });
            }
        }

        const dataDirectory = path.join(process.cwd(), 'data', 'custom-questions');
        await fs.mkdir(dataDirectory, { recursive: true });

        const fileName = `${metadata.source || 'custom'}-${Date.now()}.json`;
        const filePath = path.join(dataDirectory, fileName);

        // Check if file exists and handle overwrite
        if (!overwrite) {
            try {
                await fs.access(filePath);
                return NextResponse.json({ 
                    error: "File already exists. Set overwrite=true to replace." 
                }, { status: 409 });
            } catch {
                // File doesn't exist, continue
            }
        }

        const customQuestionData: CustomQuestionData = {
            questions: questions.map((q: any) => ({
                ...q,
                id: q.id || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            })),
            metadata: {
                ...metadata,
                lastUpdated: new Date().toISOString(),
                totalQuestions: questions.length,
                topics: [...new Set(questions.map((q: any) => q.topic))]
            }
        };

        await fs.writeFile(filePath, JSON.stringify(customQuestionData, null, 2));

        return NextResponse.json({
            message: "Custom questions added successfully",
            fileName,
            questionsCount: questions.length
        });

    } catch (error) {
        console.error('Error adding custom questions:', error);
        return NextResponse.json({ 
            error: "Internal server error",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// DELETE: Remove custom question source
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const source = searchParams.get('source');

        if (!source) {
            return NextResponse.json({ error: "Source parameter required" }, { status: 400 });
        }

        const dataDirectory = path.join(process.cwd(), 'data', 'custom-questions');
        const files = await fs.readdir(dataDirectory);
        const filesToDelete = files.filter(file => file.includes(source) && file.endsWith('.json'));

        if (filesToDelete.length === 0) {
            return NextResponse.json({ error: "No files found for the specified source" }, { status: 404 });
        }

        for (const file of filesToDelete) {
            await fs.unlink(path.join(dataDirectory, file));
        }

        return NextResponse.json({
            message: `Deleted ${filesToDelete.length} files for source: ${source}`,
            deletedFiles: filesToDelete
        });

    } catch (error) {
        console.error('Error deleting custom questions:', error);
        return NextResponse.json({ 
            error: "Internal server error",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}