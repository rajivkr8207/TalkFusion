import { useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { initSocket, getSocket } from "../lib/socket";
import { setActiveUsers } from "../features/users/usersSlice";

/**
 * useSocket — initialises the socket, registers the user, and syncs
 * the active-users list into Redux. Returns a stable ref to the socket.
 */
export const useSocket = (user) => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const socket = initSocket();
    socketRef.current = socket;

    socket.emit("register_user", user);

    const onActiveUsers = (users) => dispatch(setActiveUsers(users));
    socket.on("active_users_list", onActiveUsers);

    return () => {
      socket.off("active_users_list", onActiveUsers);
    };
  }, [user?.id, dispatch]); // depend on user.id not the whole object

  return socketRef;
};

/**
 * useSocketEvent — attach a socket listener that always calls the latest
 * version of `handler` without re-subscribing on every render.
 * 
 * This avoids duplicate listeners caused by stale closure churn.
 */
export const useSocketEvent = (eventName, handler) => {
  // Keep a stable ref to the latest handler
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !eventName) return;

    const stableHandler = (...args) => handlerRef.current(...args);
    socket.on(eventName, stableHandler);

    return () => socket.off(eventName, stableHandler);
  }, [eventName]); // only re-subscribe if the event NAME changes
};
