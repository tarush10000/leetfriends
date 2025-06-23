// app/api/debug-env/route.ts - Check environment variables (REMOVE AFTER DEBUGGING)
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    // 🚨 WARNING: This endpoint exposes sensitive info - only use for debugging!
    
    const envVars = {
        RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
        RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
        NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        NODE_ENV: process.env.NODE_ENV
    };

    // Mask the secret but show if it exists
    const debugInfo = {
        RAZORPAY_KEY_ID: {
            exists: !!envVars.RAZORPAY_KEY_ID,
            value: envVars.RAZORPAY_KEY_ID ? `${envVars.RAZORPAY_KEY_ID.slice(0, 15)}...` : 'NOT SET',
            length: envVars.RAZORPAY_KEY_ID?.length || 0,
            startsWithTest: envVars.RAZORPAY_KEY_ID?.startsWith('rzp_test_') || false,
            startsWithLive: envVars.RAZORPAY_KEY_ID?.startsWith('rzp_live_') || false
        },
        RAZORPAY_KEY_SECRET: {
            exists: !!envVars.RAZORPAY_KEY_SECRET,
            length: envVars.RAZORPAY_KEY_SECRET?.length || 0,
            firstChars: envVars.RAZORPAY_KEY_SECRET ? envVars.RAZORPAY_KEY_SECRET.slice(0, 4) + '...' : 'NOT SET'
        },
        NEXT_PUBLIC_RAZORPAY_KEY_ID: {
            exists: !!envVars.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            value: envVars.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'NOT SET',
            matches_private: envVars.RAZORPAY_KEY_ID === envVars.NEXT_PUBLIC_RAZORPAY_KEY_ID
        },
        NODE_ENV: envVars.NODE_ENV
    };

    return NextResponse.json({
        message: "🚨 DELETE THIS ENDPOINT AFTER DEBUGGING 🚨",
        debug: debugInfo,
        recommendations: [
            debugInfo.RAZORPAY_KEY_ID.exists ? '✅ RAZORPAY_KEY_ID is set' : '❌ RAZORPAY_KEY_ID is missing',
            debugInfo.RAZORPAY_KEY_SECRET.exists ? '✅ RAZORPAY_KEY_SECRET is set' : '❌ RAZORPAY_KEY_SECRET is missing',
            debugInfo.NEXT_PUBLIC_RAZORPAY_KEY_ID.matches_private ? '✅ Public and private key IDs match' : '❌ Public and private key IDs don\'t match',
            debugInfo.RAZORPAY_KEY_ID.startsWithTest ? '✅ Using test keys' : debugInfo.RAZORPAY_KEY_ID.startsWithLive ? '⚠️ Using live keys' : '❌ Invalid key format'
        ]
    });
}