import { Server } from "socket.io";

let io;

export const initSocket = (server) => {

    io = new Server(server, {
        cors: {
            origin: "*",
            credentials: true
        }
    });

    return io;
};

export const getIO = () => io;