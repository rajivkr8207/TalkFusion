import { Server } from 'socket.io'
import { config } from '../config/config.js';
import logger from '../config/logger.js';
import { handleSocketChat } from './Chat.socket.js';
import { handleVoiceSocket } from './Voice.socket.js';
import { handleMatchmakingSocket } from './Matchmaking.socket.js';
import { handleAiCallSocket } from './AiCall.socket.js';
import { activeUsers, matchmakingQueue } from './state.js';


let io
export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: config.FRONTEND_URL,
            credentials: true
        }
    })

    logger.info(`socket io server is running`);
    io.on('connection', (socket) => {
        logger.info(`user is connected`, socket.id);

        socket.on("register_user", (userData) => {
            activeUsers.set(socket.id, {
                socketId: socket.id,
                userId: userData._id || userData.id,
                username: userData.username,
                name: userData.name,
                avatarUrl: userData.avatarUrl,
                status: "online"
            });
            io.emit("active_users_list", Array.from(activeUsers.values()));
            logger.info(`User registered on socket: ${socket.id}`);
        });

        handleSocketChat(socket, io);
        handleVoiceSocket(socket, io);
        handleMatchmakingSocket(socket, io);
        handleAiCallSocket(socket);

        socket.on("disconnect", () => {
            logger.info("User disconnected:", socket.id);
            
            // Remove from active users
            if (activeUsers.has(socket.id)) {
                activeUsers.delete(socket.id);
                io.emit("active_users_list", Array.from(activeUsers.values()));
            }

            // Remove from matchmaking queue if present
            const queueIndex = matchmakingQueue.indexOf(socket.id);
            if (queueIndex > -1) {
                matchmakingQueue.splice(queueIndex, 1);
            }
        });
    })
}


export function getIO() {
    if (!io) {
        throw new Error("socket.io not initialized")
    }
    return io
}