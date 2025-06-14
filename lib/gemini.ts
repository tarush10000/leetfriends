import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function recommendQuestion(topic: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(`Recommend a LeetCode-style coding problem based on: ${topic}`);
    return result.response.text();
}

export async function fixBuggyCode(code: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(`This code has a bug, please fix it:

${code}`);
    return result.response.text();
}