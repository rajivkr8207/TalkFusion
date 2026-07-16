import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL;

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true, // Needed if using cookies for auth
    });

    socket.on('connect', () => {
      console.log('Connected to socket server:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
