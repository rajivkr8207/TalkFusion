import { createSlice } from "@reduxjs/toolkit";

/**
 * Users Slice — tracks real-time active users from Socket.io
 */
const usersSlice = createSlice({
  name: "users",
  initialState: {
    activeUsers: [],
  },
  reducers: {
    setActiveUsers: (state, action) => {
      state.activeUsers = action.payload;
    },
    clearActiveUsers: (state) => {
      state.activeUsers = [];
    },
  },
});

export const { setActiveUsers, clearActiveUsers } = usersSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────
export const selectActiveUsers = (state) => state.users.activeUsers;

export default usersSlice.reducer;
