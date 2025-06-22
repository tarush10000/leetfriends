// app/api/interview-prep/tts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface TTSRequest {
    text: string;
    voice?: string;
}

// Available voices for Gemini TTS
const VOICE_OPTIONS = {
    professional: 'Kore', // Firm voice, good for interviews
    friendly: 'Puck', // Upbeat voice
    clear: 'Charon', // Informative voice
    smooth: 'Algieba', // Smooth voice
    warm: 'Sulafat' // Warm voice
};

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: TTSRequest = await req.json();
        const { text, voice = 'professional' } = body;

        if (!text) {
            return NextResponse.json({ 
                error: "No text provided" 
            }, { status: 400 });
        }

        const selectedVoice = VOICE_OPTIONS[voice as keyof typeof VOICE_OPTIONS] || VOICE_OPTIONS.professional;

        // Call Gemini TTS API directly
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Say in a clear, professional interviewer tone: ${text}`
                        }]
                    }],
                    generationConfig: {
                        response_modalities: ['AUDIO'],
                        speech_config: {
                            voice_config: {
                                prebuilt_voice_config: {
                                    voice_name: selectedVoice
                                }
                            }
                        }
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error("Gemini TTS error:", error);
            throw new Error("TTS generation failed");
        }

        const data = await response.json();
        
        // Extract audio data from response
        const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data;
        
        if (!audioData) {
            throw new Error("No audio data in response");
        }

        // Convert base64 to buffer
        const audioBuffer = Buffer.from(audioData, 'base64');

        // Return audio with proper headers
        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': audioBuffer.length.toString(),
                'Cache-Control': 'no-cache',
            }
        });

    } catch (error) {
        console.error("TTS error:", error);
        return NextResponse.json({ 
            error: "TTS generation failed",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}