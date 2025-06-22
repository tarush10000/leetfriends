// app/api/interview-prep/generate-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PDFDocument from 'pdfkit';

interface PDFData {
    questions: Array<{
        question: string;
        userAnswer: string;
        score: number;
        feedback: string[];
        topic: string;
        difficulty: string;
    }>;
    overallScore: number;
    totalQuestions: number;
    answeredQuestions: number;
    timestamp: string;
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data: PDFData = await req.json();

        // Create a new PDF document
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        // Set up the response
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        
        const pdfPromise = new Promise<Buffer>((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
        });

        // Helper function to add a new page if needed
        const checkPageSpace = (requiredSpace: number) => {
            if (doc.y + requiredSpace > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                return true;
            }
            return false;
        };

        // Helper function to wrap text
        const addWrappedText = (text: string, options: any = {}) => {
            const lines = doc.heightOfString(text, { width: doc.page.width - 100, ...options });
            checkPageSpace(lines + 20);
            doc.text(text, { width: doc.page.width - 100, ...options });
        };

        // Header
        doc.fontSize(24)
           .fillColor('#7c3aed')
           .text('Interview Practice Results', { align: 'center' });

        doc.moveDown(0.5);

        // Date and user info
        doc.fontSize(12)
           .fillColor('#64748b')
           .text(`Generated: ${new Date(data.timestamp).toLocaleDateString('en-US', {
               year: 'numeric',
               month: 'long',
               day: 'numeric',
               hour: '2-digit',
               minute: '2-digit'
           })}`, { align: 'center' });

        doc.moveDown(1);

        // Overall Score Section
        doc.rect(50, doc.y, doc.page.width - 100, 80)
           .fillAndStroke('#f8fafc', '#e2e8f0');

        const scoreY = doc.y + 20;
        doc.fontSize(48)
           .fillColor('#7c3aed')
           .text(`${data.overallScore}%`, 70, scoreY);

        doc.fontSize(14)
           .fillColor('#334155')
           .text('Overall Score', 200, scoreY + 10);

        doc.fontSize(12)
           .fillColor('#64748b')
           .text(`${data.answeredQuestions}/${data.totalQuestions} questions answered`, 200, scoreY + 30);

        doc.y += 100;
        doc.moveDown(1);

        // Performance Summary
        const getPerformanceLevel = (score: number) => {
            if (score >= 80) return { text: 'Excellent', color: '#10b981' };
            if (score >= 70) return { text: 'Good', color: '#f59e0b' };
            if (score >= 60) return { text: 'Average', color: '#ef4444' };
            return { text: 'Needs Improvement', color: '#dc2626' };
        };

        const performance = getPerformanceLevel(data.overallScore);
        
        doc.fontSize(16)
           .fillColor('#1e293b')
           .text('Performance Summary');

        doc.fontSize(12)
           .fillColor(performance.color)
           .text(`Performance Level: ${performance.text}`);

        doc.moveDown(0.5);

        // Statistics
        const topicStats: { [key: string]: { total: number, avgScore: number } } = {};
        data.questions.forEach(q => {
            if (!topicStats[q.topic]) {
                topicStats[q.topic] = { total: 0, avgScore: 0 };
            }
            topicStats[q.topic].total++;
            topicStats[q.topic].avgScore += q.score;
        });

        Object.keys(topicStats).forEach(topic => {
            topicStats[topic].avgScore = Math.round(topicStats[topic].avgScore / topicStats[topic].total);
        });

        doc.fillColor('#1e293b')
           .text('Topic Breakdown:');

        Object.entries(topicStats).forEach(([topic, stats]) => {
            doc.fontSize(11)
               .fillColor('#64748b')
               .text(`• ${topic.toUpperCase()}: ${stats.total} questions, ${stats.avgScore}% average`);
        });

        doc.moveDown(1);

        // Questions Section
        doc.fontSize(18)
           .fillColor('#1e293b')
           .text('Detailed Results');

        doc.moveDown(0.5);

        data.questions.forEach((question, index) => {
            checkPageSpace(150);

            // Question header
            doc.rect(50, doc.y, doc.page.width - 100, 30)
               .fillAndStroke('#f1f5f9', '#e2e8f0');

            doc.fontSize(12)
               .fillColor('#1e293b')
               .text(`Question ${index + 1}`, 60, doc.y + 10);

            // Score badge
            const scoreColor = question.score >= 70 ? '#10b981' : question.score >= 50 ? '#f59e0b' : '#ef4444';
            doc.fontSize(11)
               .fillColor(scoreColor)
               .text(`${question.score}%`, doc.page.width - 100, doc.y - 5);

            // Topic and difficulty badges
            doc.fontSize(10)
               .fillColor('#7c3aed')
               .text(`${question.topic.toUpperCase()} • ${question.difficulty}`, 60, doc.y + 5);

            doc.y += 40;
            doc.moveDown(0.3);

            // Question text
            doc.fontSize(11)
               .fillColor('#1e293b');
            addWrappedText(`Q: ${question.question}`, { continued: false });

            doc.moveDown(0.3);

            // User answer
            doc.fontSize(10)
               .fillColor('#64748b')
               .text('Your Answer:');
            
            doc.fontSize(10)
               .fillColor('#374151');
            addWrappedText(question.userAnswer || 'No answer provided');

            doc.moveDown(0.3);

            // Feedback
            if (question.feedback && question.feedback.length > 0) {
                doc.fontSize(10)
                   .fillColor('#64748b')
                   .text('Feedback:');

                question.feedback.forEach(feedback => {
                    doc.fontSize(9)
                       .fillColor('#374151');
                    addWrappedText(`• ${feedback}`);
                });
            }

            doc.moveDown(0.8);

            // Add separator line
            doc.strokeColor('#e2e8f0')
               .lineWidth(1)
               .moveTo(50, doc.y)
               .lineTo(doc.page.width - 50, doc.y)
               .stroke();

            doc.moveDown(0.5);
        });

        // Footer
        checkPageSpace(50);
        doc.fontSize(10)
           .fillColor('#94a3b8')
           .text('Generated by LeetFriends Interview Prep', { align: 'center' });

        // Finalize the PDF
        doc.end();

        const pdfBuffer = await pdfPromise;

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="interview-results-${new Date().toISOString().split('T')[0]}.pdf"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });

    } catch (error) {
        console.error('PDF generation error:', error);
        return NextResponse.json({
            error: "Failed to generate PDF",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}