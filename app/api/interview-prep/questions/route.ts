// app/api/interview-prep/questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface GitHubFile {
    name: string;
    download_url: string;
    type: string;
}

interface CSVRow {
    Difficulty: string;
    Title: string;
    Frequency: string;
    Acceptance: string;
    Link: string;
}

const GITHUB_API_BASE = "https://api.github.com/repos/liquidslr/leetcode-company-wise-problems/contents";

export async function GET(_req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Enhanced error handling for GitHub API
        const companiesResponse = await fetch(GITHUB_API_BASE, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'LeetFriends-App',
                // Add GitHub token if available for higher rate limits
                ...(process.env.GITHUB_TOKEN && {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`
                })
            },
            // Add timeout to prevent hanging requests
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (!companiesResponse.ok) {
            const errorText = await companiesResponse.text();
            console.error(`GitHub API Error: ${companiesResponse.status} - ${errorText}`);
            
            // Check for specific error types
            if (companiesResponse.status === 403) {
                console.error("GitHub API rate limit exceeded");
                return NextResponse.json({ 
                    error: "Rate limit exceeded. Please try again later." 
                }, { status: 429 });
            }
            
            if (companiesResponse.status === 404) {
                console.error("GitHub repository not found");
                return NextResponse.json({ 
                    error: "Repository not found" 
                }, { status: 404 });
            }
            
            throw new Error(`GitHub API request failed: ${companiesResponse.status}`);
        }

        const companies: GitHubFile[] = await companiesResponse.json();
        const companyDirs = companies.filter(item => item.type === 'dir');

        if (companyDirs.length === 0) {
            console.warn("No company directories found in repository");
            return NextResponse.json({
                questions: [],
                companies: []
            });
        }

        const allQuestions: any[] = [];
        const companyStats: any[] = [];

        // Process each company (limit to first 20 for performance)
        const companiesToProcess = companyDirs.slice(0, 20);

        for (const company of companiesToProcess) {
            try {
                // Add delay to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 100));

                // Fetch CSV files for this company with timeout
                const companyFilesResponse = await fetch(`${GITHUB_API_BASE}/${company.name}`, {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'LeetFriends-App',
                        ...(process.env.GITHUB_TOKEN && {
                            'Authorization': `token ${process.env.GITHUB_TOKEN}`
                        })
                    },
                    signal: AbortSignal.timeout(10000)
                });

                if (!companyFilesResponse.ok) {
                    console.warn(`Failed to fetch files for company ${company.name}: ${companyFilesResponse.status}`);
                    continue;
                }

                const companyFiles: GitHubFile[] = await companyFilesResponse.json();
                const csvFiles = companyFiles.filter(file => file.name.endsWith('.csv'));

                let companyQuestionCount = 0;

                for (const csvFile of csvFiles) {
                    try {
                        // Add delay between CSV file requests
                        await new Promise(resolve => setTimeout(resolve, 200));

                        // Fetch and parse CSV content with timeout
                        const csvResponse = await fetch(csvFile.download_url, {
                            signal: AbortSignal.timeout(15000)
                        });
                        
                        if (!csvResponse.ok) {
                            console.warn(`Failed to fetch CSV ${csvFile.name}: ${csvResponse.status}`);
                            continue;
                        }

                        const csvText = await csvResponse.text();
                        const rows = parseCSV(csvText);

                        // Convert to our question format
                        const questions = rows.map((row, index) => ({
                            id: `${company.name}-${csvFile.name}-${index}`,
                            title: row.Title || 'Unknown Title',
                            difficulty: normalizeDifficulty(row.Difficulty),
                            frequency: parseInt(row.Frequency) || 0,
                            acceptance: parseFloat(row.Acceptance) || 0,
                            link: row.Link || '#',
                            company: formatCompanyName(company.name),
                            timeFrame: getTimeFrameFromFileName(csvFile.name),
                            isCompleted: false
                        }));

                        allQuestions.push(...questions);
                        companyQuestionCount += questions.length;

                    } catch (csvError) {
                        console.error(`Error processing CSV ${csvFile.name}:`, csvError);
                        continue;
                    }
                }

                // Add company stats
                if (companyQuestionCount > 0) {
                    companyStats.push({
                        name: formatCompanyName(company.name),
                        logo: getCompanyLogo(company.name),
                        totalQuestions: companyQuestionCount,
                        completedQuestions: 0,
                        averageDifficulty: calculateAverageDifficulty(
                            allQuestions.filter(q => q.company === formatCompanyName(company.name))
                        ),
                        lastUpdated: new Date().toISOString()
                    });
                }

            } catch (companyError) {
                console.error(`Error processing company ${company.name}:`, companyError);
                continue;
            }
        }

        // Sort questions by frequency and remove duplicates
        const uniqueQuestions = removeDuplicateQuestions(allQuestions);
        const sortedQuestions = uniqueQuestions.sort((a, b) => b.frequency - a.frequency);

        return NextResponse.json({
            questions: sortedQuestions.slice(0, 1000),
            companies: companyStats.sort((a, b) => b.totalQuestions - a.totalQuestions)
        });

    } catch (error) {
        console.error("Interview prep API error:", error);
        
        // Return more specific error messages
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                return NextResponse.json({ 
                    error: "Request timeout. Please try again." 
                }, { status: 408 });
            }
            
            if (error.message.includes('fetch')) {
                return NextResponse.json({ 
                    error: "Network error. Please check your connection." 
                }, { status: 503 });
            }
        }
        
        return NextResponse.json({ 
            error: "Internal server error" 
        }, { status: 500 });
    }
}

// Helper functions remain the same
function parseCSV(csvText: string): CSVRow[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headerLine = lines[0];
    const rows: CSVRow[] = [];

    // Simple CSV parsing - split by comma and handle quotes
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length >= 4) { // Ensure minimum required columns
            rows.push({
                Difficulty: values[0] || '',
                Title: values[1] || '',
                Frequency: values[2] || '0',
                Acceptance: values[3] || '0',
                Link: values[4] || ''
            });
        }
    }

    return rows;
}

function normalizeDifficulty(difficulty: string): string {
    const normalized = difficulty?.toLowerCase().trim();
    if (normalized === 'easy' || normalized === '1') return 'Easy';
    if (normalized === 'medium' || normalized === '2') return 'Medium';
    if (normalized === 'hard' || normalized === '3') return 'Hard';
    return 'Medium'; // Default fallback
}

function formatCompanyName(name: string): string {
    return name.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function getTimeFrameFromFileName(fileName: string): string {
    const mapping: Record<string, string> = {
        '1. Thirty Days.csv': 'Last 30 Days',
        '2. Three Months.csv': 'Last 3 Months',
        '3. Six Months.csv': 'Last 6 Months',
        '4. More Than Six Months.csv': '6+ Months Ago',
        '5. All.csv': 'All Time'
    };
    return mapping[fileName] || 'Unknown';
}

function getCompanyLogo(companyName: string): string {
    const logos: Record<string, string> = {
        'amd': '💻',
        'google': '🔍',
        'meta': '👤',
        'amazon': '📦',
        'apple': '🍎',
        'microsoft': '🪟',
        'netflix': '🎬',
        'adobe': '🔴',
        'uber': '🚗',
        'tesla': '⚡'
    };
    return logos[companyName.toLowerCase()] || '🏢';
}

function calculateAverageDifficulty(questions: any[]): string {
    if (questions.length === 0) return 'Medium';
    
    const difficultyScores = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
    const totalScore = questions.reduce((sum, q) => sum + (difficultyScores[q.difficulty as keyof typeof difficultyScores] || 2), 0);
    const avgScore = totalScore / questions.length;
    
    if (avgScore < 1.5) return 'Easy';
    if (avgScore < 2.5) return 'Medium';
    return 'Hard';
}

function removeDuplicateQuestions(questions: any[]): any[] {
    const seen = new Set();
    return questions.filter(q => {
        const key = `${q.title}-${q.company}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}