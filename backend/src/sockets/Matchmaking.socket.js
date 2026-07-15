import { activeUsers, matchmakingQueue } from "./state.js";
import crypto from "crypto";

export const handleMatchmakingSocket = (socket, io) => {
    socket.on("join_random_matchmaking", () => {
        // Ensure user is registered in activeUsers first
        const user = activeUsers.get(socket.id);
        if (!user) {
            return socket.emit("error", { message: "User not registered in active users." });
        }

        // Prevent adding if already in queue
        if (matchmakingQueue.includes(socket.id)) {
            return;
        }

        matchmakingQueue.push(socket.id);
        user.status = "looking-for-match";
        activeUsers.set(socket.id, user);
        
        io.emit("active_users_list", Array.from(activeUsers.values()));

        console.log(`User ${socket.id} joined matchmaking. Queue size: ${matchmakingQueue.length}`);

        // Check for match
        if (matchmakingQueue.length >= 2) {
            const user1SocketId = matchmakingQueue.shift();
            const user2SocketId = matchmakingQueue.shift();

            const roomId = `room_${crypto.randomUUID()}`;

            // Update statuses
            const user1 = activeUsers.get(user1SocketId);
            const user2 = activeUsers.get(user2SocketId);

            if (user1) user1.status = "in-call";
            if (user2) user2.status = "in-call";

            io.emit("active_users_list", Array.from(activeUsers.values()));

            // Force them to join the newly created room (for signaling purposes if needed, though direct messages work too)
            io.sockets.sockets.get(user1SocketId)?.join(roomId);
            io.sockets.sockets.get(user2SocketId)?.join(roomId);

            // Notify both users
            io.to(user1SocketId).emit("random_match_found", {
                roomId,
                role: "caller",
                matchedUserId: user2SocketId,
                matchedUserData: user2
            });

            io.to(user2SocketId).emit("random_match_found", {
                roomId,
                role: "receiver",
                matchedUserId: user1SocketId,
                matchedUserData: user1
            });
            
            console.log(`Matched ${user1SocketId} with ${user2SocketId} in room ${roomId}`);
        }
    });

    socket.on("leave_random_matchmaking", () => {
        const index = matchmakingQueue.indexOf(socket.id);
        if (index > -1) {
            matchmakingQueue.splice(index, 1);
            const user = activeUsers.get(socket.id);
            if (user) {
                user.status = "online";
                activeUsers.set(socket.id, user);
                io.emit("active_users_list", Array.from(activeUsers.values()));
            }
            console.log(`User ${socket.id} left matchmaking`);
        }
    });
};
