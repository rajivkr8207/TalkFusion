import { getAiResponse } from "../services/ai.service.js";

export const handleSocketChat = (socket, io) => {
    // Original AI chat
    socket.on("send_message", async (data) => {
        try {
            const { message } = data;
            socket.emit("typing", true);
            const response = await getAiResponse(message);
            socket.emit("typing", false);
            socket.emit("receive_message", { response });
        } catch (err) {
            console.error(err);
            socket.emit("error", "Something went wrong");
        }
    });

    // Room-based live chat between users in a call
    socket.on("send_room_message", (msgData) => {
        const { roomId } = msgData;
        if (!roomId) return;
        // Broadcast to the room (excluding sender — sender already added it locally)
        socket.to(roomId).emit("chat_message", msgData);
    });

    // Typing indicator for room
    socket.on("typing", (data) => {
        const { roomId, userId, isTyping } = data;
        if (!roomId) return;
        socket.to(roomId).emit("typing_indicator", { userId, isTyping });
    });
};