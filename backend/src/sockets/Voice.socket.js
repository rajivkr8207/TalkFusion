import { activeUsers } from "./state.js";

export const handleVoiceSocket = (socket, io) => {
    socket.on("join_voice_room", (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined voice room: ${roomId}`);
        socket.to(roomId).emit("user_joined_voice", { userId: socket.id });
    });

    socket.on("voice_offer", (data) => {
        const { targetUserId, offer } = data;
        
        // Update statuses to in-call for direct calls
        const caller = activeUsers.get(socket.id);
        const receiver = activeUsers.get(targetUserId);
        if (caller) caller.status = "in-call";
        if (receiver) receiver.status = "in-call";
        io.emit("active_users_list", Array.from(activeUsers.values()));

        socket.to(targetUserId).emit("voice_offer", {
            userId: socket.id,
            offer: offer
        });
    });

    socket.on("voice_answer", (data) => {
        const { targetUserId, answer } = data;
        socket.to(targetUserId).emit("voice_answer", {
            userId: socket.id,
            answer: answer
        });
    });

    socket.on("voice_ice_candidate", (data) => {
        const { targetUserId, candidate } = data;
        socket.to(targetUserId).emit("voice_ice_candidate", {
            userId: socket.id,
            candidate: candidate
        });
    });

    socket.on("leave_voice_room", (roomId) => {
        socket.leave(roomId);
        console.log(`User ${socket.id} left voice room: ${roomId}`);
        socket.to(roomId).emit("user_left_voice", { userId: socket.id });
    });

    socket.on("end_call", (data) => {
        const { targetUserId } = data;
        
        // Reset statuses to online
        const caller = activeUsers.get(socket.id);
        const receiver = activeUsers.get(targetUserId);
        if (caller) caller.status = "online";
        if (receiver) receiver.status = "online";
        io.emit("active_users_list", Array.from(activeUsers.values()));

        // Notify target user that the call ended
        socket.to(targetUserId).emit("call_ended", { userId: socket.id });
        console.log(`Call ended between ${socket.id} and ${targetUserId}`);
    });
};
