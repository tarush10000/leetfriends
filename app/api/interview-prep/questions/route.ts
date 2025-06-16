// app/api/interview-prep/questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MongoClient } from "mongodb";

const TIER_1_COMPANIES = [
    'Google', 'Meta', 'Amazon', 'Apple', 'Microsoft', 'Netflix', 'Tesla',
    'Uber', 'Airbnb', 'Spotify', 'Adobe', 'Salesforce', 'Oracle', 'Intel', 'AMD'
];

const TIER_2_COMPANIES = [
    'Goldman Sachs', 'JPMorgan', 'Morgan Stanley', 'Citadel', 'Two Sigma',
    'Palantir', 'Databricks', 'Snowflake', 'Stripe', 'Square', 'Coinbase',
    'Robinhood', 'DoorDash', 'Instacart', 'Zoom', 'Slack', 'Atlassian'
];

// Create a separate connection for interview_prep database
async function connectToInterviewDatabase() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI environment variable is not defined");
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    return client.db("interview_prep");
}

function getCompanyTier(company: string): string {
    if (TIER_1_COMPANIES.includes(company)) return "Tier 1";
    if (TIER_2_COMPANIES.includes(company)) return "Tier 2";
    return "Tier 3";
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const filters = {
            company: searchParams.get('company') || 'all',
            difficulty: searchParams.get('difficulty') || 'all',
            time_period: searchParams.get('time_period') || 'all',
            search: searchParams.get('search') || '',
            limit: parseInt(searchParams.get('limit') || '50'),
            offset: parseInt(searchParams.get('offset') || '0'),
            sort_by: searchParams.get('sort_by') || 'recent'
        };

        console.log("API Filters:", filters);

        const db = await connectToInterviewDatabase();
        const questionsCollection = db.collection("questions");
        const questionsAskedCollection = db.collection("questions_asked");

        // Build the aggregation pipeline that groups by question_id and collects all companies
        const pipeline: any[] = [
            // First, get all question-company combinations with filters applied
            {
                $lookup: {
                    from: "questions_asked",
                    localField: "question_id",
                    foreignField: "question_id",
                    as: "asked_data"
                }
            },
            
            // Only keep questions that have company data
            { $match: { "asked_data.0": { $exists: true } } },
            
            // Unwind to process each company separately
            { $unwind: "$asked_data" },
            
            // Apply company and time period filters at the company level
            {
                $match: {
                    ...(filters.company !== 'all' && { "asked_data.company": filters.company }),
                    ...(filters.time_period !== 'all' && { "asked_data.time_period": filters.time_period })
                }
            },
            
            // Group back by question_id to collect all companies for each question
            {
                $group: {
                    _id: "$question_id",
                    question_data: { $first: "$$ROOT" },
                    companies: {
                        $push: {
                            name: "$asked_data.company",
                            frequency: "$asked_data.frequency",
                            time_period: "$asked_data.time_period",
                            tier: {
                                $cond: {
                                    if: { $in: ["$asked_data.company", TIER_1_COMPANIES] },
                                    then: "Tier 1",
                                    else: {
                                        $cond: {
                                            if: { $in: ["$asked_data.company", TIER_2_COMPANIES] },
                                            then: "Tier 2",
                                            else: "Tier 3"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    total_frequency: { $sum: "$asked_data.frequency" },
                    max_frequency: { $max: "$asked_data.frequency" },
                    company_count: { $sum: 1 },
                    highest_tier: {
                        $min: {
                            $cond: {
                                if: { $in: ["$asked_data.company", TIER_1_COMPANIES] },
                                then: 1,
                                else: {
                                    $cond: {
                                        if: { $in: ["$asked_data.company", TIER_2_COMPANIES] },
                                        then: 2,
                                        else: 3
                                    }
                                }
                            }
                        }
                    },
                    most_recent_score: {
                        $max: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$asked_data.time_period", "Last 30 Days"] }, then: 5 },
                                    { case: { $eq: ["$asked_data.time_period", "Last 3 Months"] }, then: 4 },
                                    { case: { $eq: ["$asked_data.time_period", "Last 6 Months"] }, then: 3 },
                                    { case: { $eq: ["$asked_data.time_period", "6+ Months Ago"] }, then: 2 }
                                ],
                                default: 1
                            }
                        }
                    }
                }
            },
            
            // Add computed fields for the grouped question
            {
                $addFields: {
                    question_id: "$_id",
                    title: "$question_data.title",
                    difficulty: "$question_data.difficulty",
                    leetcode_link: "$question_data.leetcode_link",
                    topics: "$question_data.topics",
                    acceptance_rate: "$question_data.acceptance_rate",
                    
                    // Calculate priority score based on all companies
                    priority_score: {
                        $add: [
                            "$total_frequency",
                            {
                                $multiply: [
                                    "$company_count",
                                    {
                                        $switch: {
                                            branches: [
                                                { case: { $eq: ["$highest_tier", 1] }, then: 20 },
                                                { case: { $eq: ["$highest_tier", 2] }, then: 10 }
                                            ],
                                            default: 5
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    
                    recency_score: "$most_recent_score",
                    
                    // Get the highest tier as string
                    company_tier: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$highest_tier", 1] }, then: "Tier 1" },
                                { case: { $eq: ["$highest_tier", 2] }, then: "Tier 2" }
                            ],
                            default: "Tier 3"
                        }
                    }
                }
            }
        ];

        // Apply remaining filters
        const matchConditions: any = {};

        if (filters.difficulty !== 'all') {
            matchConditions.difficulty = filters.difficulty.toUpperCase();
        }

        if (filters.search) {
            matchConditions.$or = [
                { title: new RegExp(filters.search, 'i') },
                { "companies.name": new RegExp(filters.search, 'i') }
            ];
        }

        if (Object.keys(matchConditions).length > 0) {
            pipeline.push({ $match: matchConditions });
        }

        // Add sorting
        let sortStage: any = {};
        switch (filters.sort_by) {
            case 'recent':
                sortStage = { recency_score: -1, total_frequency: -1 };
                break;
            case 'frequency':
                sortStage = { total_frequency: -1, priority_score: -1 };
                break;
            case 'acceptance':
                sortStage = { acceptance_rate: -1, total_frequency: -1 };
                break;
            case 'difficulty':
                sortStage = { difficulty: 1, total_frequency: -1 };
                break;
            default:
                sortStage = { priority_score: -1, total_frequency: -1 };
        }
        pipeline.push({ $sort: sortStage });

        // Add pagination
        pipeline.push({ $skip: filters.offset });
        pipeline.push({ $limit: filters.limit });

        console.log("Executing pipeline with", pipeline.length, "stages");

        // Execute the aggregation
        const questions = await questionsCollection.aggregate(pipeline).toArray();
        console.log("Questions found:", questions.length);

        // Get company statistics
        const companyStats = await questionsAskedCollection.aggregate([
            {
                $group: {
                    _id: "$company",
                    total_questions: { $sum: 1 },
                    avg_frequency: { $avg: "$frequency" },
                    recent_questions: {
                        $sum: {
                            $cond: [
                                { $in: ["$time_period", ["Last 30 Days", "Last 3 Months"]] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $addFields: {
                    company_tier: {
                        $cond: {
                            if: { $in: ["$_id", TIER_1_COMPANIES] },
                            then: "Tier 1",
                            else: {
                                $cond: {
                                    if: { $in: ["$_id", TIER_2_COMPANIES] },
                                    then: "Tier 2",
                                    else: "Tier 3"
                                }
                            }
                        }
                    }
                }
            },
            {
                $sort: {
                    company_tier: 1,
                    total_questions: -1
                }
            }
        ]).toArray();

        console.log("Company stats found:", companyStats.length);

        // Get correct statistics
        const totalUniqueQuestions = await questionsCollection.countDocuments();
        
        // Get total question-company combinations (not unique questions)
        const totalQuestionCompanyCombinations = await questionsAskedCollection.countDocuments();
        
        // Get recent questions count (unique questions asked in last 3 months)
        const recentQuestionsCount = await questionsAskedCollection.aggregate([
            {
                $match: {
                    time_period: { $in: ["Last 30 Days", "Last 3 Months"] }
                }
            },
            {
                $group: {
                    _id: "$question_id"
                }
            },
            {
                $count: "uniqueRecentQuestions"
            }
        ]).toArray();

        const recentQuestions = recentQuestionsCount.length > 0 ? recentQuestionsCount[0].uniqueRecentQuestions : 0;

        // Get difficulty and topic stats
        const difficultyStats = await questionsCollection.aggregate([
            {
                $group: {
                    _id: "$difficulty",
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        const topicStats = await questionsCollection.aggregate([
            { $unwind: { path: "$topics", preserveNullAndEmptyArrays: true } },
            { $match: { topics: { $ne: null } } },
            {
                $group: {
                    _id: "$topics",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]).toArray();

        // Get total count for pagination
        const countPipeline = pipeline.slice(0, -2); // Remove skip and limit
        const totalResults = await questionsCollection.aggregate([
            ...countPipeline,
            { $count: "total" }
        ]).toArray();
        
        const totalQuestions = totalResults.length > 0 ? totalResults[0].total : 0;

        const response = {
            questions: questions.map(q => ({
                id: q.question_id,
                title: q.title,
                difficulty: q.difficulty,
                frequency: q.total_frequency, // Total frequency across all companies
                acceptance: q.acceptance_rate || 50,
                link: q.leetcode_link,
                
                // Primary company (highest frequency or tier)
                company: q.companies.sort((a: any, b: any) => {
                    const tierDiff = (a.tier === "Tier 1" ? 1 : a.tier === "Tier 2" ? 2 : 3) - 
                                   (b.tier === "Tier 1" ? 1 : b.tier === "Tier 2" ? 2 : 3);
                    return tierDiff !== 0 ? tierDiff : b.frequency - a.frequency;
                })[0]?.name || 'Unknown',
                
                // All companies that asked this question
                companies: q.companies.map((c: any) => ({
                    name: c.name,
                    frequency: c.frequency,
                    tier: c.tier,
                    timePeriod: c.time_period
                })),
                
                companyCount: q.company_count,
                timeFrame: q.companies[0]?.time_period || 'All Time',
                topics: q.topics || [],
                companyTier: q.company_tier,
                priorityScore: q.priority_score,
                recencyScore: q.recency_score,
                isCompleted: false
            })),
            companies: companyStats.map(c => ({
                name: c._id,
                totalQuestions: c.total_questions,
                avgFrequency: Math.round((c.avg_frequency || 0) * 10) / 10,
                recentQuestions: c.recent_questions || 0,
                tier: c.company_tier,
                completedQuestions: 0
            })),
            stats: {
                totalQuestions: totalUniqueQuestions,
                totalCombinations: totalQuestionCompanyCombinations,
                recentQuestions: recentQuestions,
                topicDistribution: topicStats,
                difficultyDistribution: difficultyStats,
                tier1Companies: TIER_1_COMPANIES,
                tier2Companies: TIER_2_COMPANIES
            },
            pagination: {
                total: totalQuestions,
                limit: filters.limit,
                offset: filters.offset,
                hasMore: filters.offset + filters.limit < totalQuestions
            }
        };

        console.log("Returning response with", response.questions.length, "questions and", response.companies.length, "companies");
        return NextResponse.json(response);

    } catch (error) {
        console.error("Interview prep API error:", error);
        return NextResponse.json({ 
            error: "Internal server error", 
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}