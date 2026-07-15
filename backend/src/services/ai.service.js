import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { config } from "../config/config.js"
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";

const llm = new ChatGoogleGenerativeAI({
    apiKey: config.GOOGLE_API_KEY,
    model: "gemini-2.5-flash",
})

// System persona for the AI caller
const AI_SYSTEM_PROMPT = `You are Aria, a friendly, witty, and helpful AI calling assistant on CallingWeb, a voice-calling platform. 
You are having a real-time voice conversation with the user.
Keep your responses concise and conversational — 1-3 short sentences max.
Be natural, warm, and engaging. Use a conversational tone, not formal.
Avoid lists, bullet points, or markdown — respond as if speaking aloud.
If the user asks you something complex, give a clear simple spoken answer.
CRITICAL: Always respond in the same language the user speaks to you.`;

export async function getAiResponse(prompt) {
    const result = await llm.invoke([
        new HumanMessage({ content: prompt }),
    ])
    return result.content
}

// Multi-turn AI chat for voice calls
export async function getAiCallResponse(history, userMessage) {
    const messages = [
        new SystemMessage(AI_SYSTEM_PROMPT),
        ...history.map(m => m.role === 'user'
            ? new HumanMessage(m.content)
            : new AIMessage(m.content)
        ),
        new HumanMessage(userMessage)
    ];
    const result = await llm.invoke(messages);
    return result.content;
}
