import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import usersReducer from "../features/users/usersSlice";

// ─── Manual localStorage Persistence ──────────────────────────────────────
// Only auth.user is saved — volatile socket state is always fresh on connect.

const STORAGE_KEY = "talkfusion-auth";

const loadPreloadedState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const user = JSON.parse(raw);
    return {
      auth: { user, loading: false, error: null, updateSuccess: false },
    };
  } catch {
    return undefined;
  }
};

const saveUserToStorage = (user) => {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // storage full or private-browsing — silently ignore
  }
};

// ─── Root Reducer ──────────────────────────────────────────────────────────
const rootReducer = combineReducers({
  auth: authReducer,
  users: usersReducer,
});

// ─── Store ─────────────────────────────────────────────────────────────────
export const store = configureStore({
  reducer: rootReducer,
  preloadedState: loadPreloadedState(), // rehydrate from localStorage on startup
  devTools: import.meta.env.DEV,
});

// Subscribe: persist only auth.user whenever it changes
let previousUser = store.getState().auth.user;
store.subscribe(() => {
  const currentUser = store.getState().auth.user;
  if (currentUser !== previousUser) {
    previousUser = currentUser;
    saveUserToStorage(currentUser);
  }
});
