import { getAiCallResponse } from "../services/ai.service.js";

// Per-socket conversation history store
const callSessions = new Map(); // socketId -> [ {role, content}, ... ]

export const handleAiCallSocket = (socket) => {

    // Start a new AI call session
    socket.on("ai_call_start", () => {
        callSessions.set(socket.id, []);
        console.log(`AI call session started: ${socket.id}`);
        // Greet the user
        const greeting = "Hey there! I'm Aria, your AI assistant. How are you doing today? What's on your mind?";
        socket.emit("ai_response", { text: greeting, isFinal: true });
    });

    // Handle a user's spoken/typed message
    socket.on("ai_call_message", async (data) => {
        const { text } = data;
        if (!text || !text.trim()) return;

        const history = callSessions.get(socket.id) || [];

        // Signal that AI is "thinking"
        socket.emit("ai_thinking", true);

        try {
            const aiText = await getAiCallResponse(history, text);

            // Save to history
            history.push({ role: 'user', content: text });
            history.push({ role: 'assistant', content: aiText });
            callSessions.set(socket.id, history);

            socket.emit("ai_thinking", false);
            socket.emit("ai_response", { text: aiText, isFinal: true });
        } catch (err) {
            console.error("AI call error:", err);
            socket.emit("ai_thinking", false);
            socket.emit("ai_response", { text: "Sorry, I had trouble understanding that. Could you repeat?", isFinal: true });
        }
    });

    // Clean up on end
    socket.on("ai_call_end", () => {
        callSessions.delete(socket.id);
        console.log(`AI call session ended: ${socket.id}`);
    });

    // Also clean up on disconnect
    socket.on("disconnect", () => {
        callSessions.delete(socket.id);
    });
};
