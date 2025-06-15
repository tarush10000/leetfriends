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

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch company directories
        const companiesResponse = await fetch(GITHUB_API_BASE, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'LeetFriends-App'
            }
        });

        if (!companiesResponse.ok) {
            throw new Error('Failed to fetch companies');
        }

        const companies: GitHubFile[] = await companiesResponse.json();
        const companyDirs = companies.filter(item => item.type === 'dir');

        const allQuestions: any[] = [];
        const companyStats: any[] = [];

        // Process each company (limit to first 20 for performance)
        const companiesToProcess = companyDirs.slice(0, 20);

        for (const company of companiesToProcess) {
            try {
                // Fetch CSV files for this company
                const companyFilesResponse = await fetch(`${GITHUB_API_BASE}/${company.name}`, {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'LeetFriends-App'
                    }
                });

                if (!companyFilesResponse.ok) continue;

                const companyFiles: GitHubFile[] = await companyFilesResponse.json();
                const csvFiles = companyFiles.filter(file => file.name.endsWith('.csv'));

                let companyQuestionCount = 0;

                for (const csvFile of csvFiles) {
                    try {
                        // Fetch and parse CSV content
                        const csvResponse = await fetch(csvFile.download_url);
                        if (!csvResponse.ok) continue;

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

                    } catch (error) {
                        console.error(`Error processing ${csvFile.name}:`, error);
                    }
                }

                // Add company stats
                companyStats.push({
                    name: formatCompanyName(company.name),
                    logo: getCompanyLogo(company.name),
                    totalQuestions: companyQuestionCount,
                    completedQuestions: 0, // Will be updated with user progress
                    averageDifficulty: calculateAverageDifficulty(allQuestions.filter(q => q.company === formatCompanyName(company.name))),
                    lastUpdated: new Date().toISOString()
                });

            } catch (error) {
                console.error(`Error processing company ${company.name}:`, error);
            }
        }

        // Sort questions by frequency and remove duplicates
        const uniqueQuestions = removeDuplicateQuestions(allQuestions);
        const sortedQuestions = uniqueQuestions.sort((a, b) => b.frequency - a.frequency);

        return NextResponse.json({
            questions: sortedQuestions.slice(0, 1000), // Limit to 1000 questions for performance
            companies: companyStats.sort((a, b) => b.totalQuestions - a.totalQuestions)
        });

    } catch (error) {
        console.error("Interview prep API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

function parseCSV(csvText: string): CSVRow[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 4) {
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

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result.map(val => val.replace(/"/g, ''));
}

function normalizeDifficulty(difficulty: string): 'Easy' | 'Medium' | 'Hard' {
    const lower = difficulty.toLowerCase().trim();
    if (lower.includes('easy')) return 'Easy';
    if (lower.includes('medium')) return 'Medium';
    if (lower.includes('hard')) return 'Hard';
    return 'Medium'; // default
}

function formatCompanyName(name: string): string {
    return name.replace(/-/g, ' ').replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
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
    const totalScore = questions.reduce((sum, q) => sum + difficultyScores[q.difficulty as keyof typeof difficultyScores], 0);
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
