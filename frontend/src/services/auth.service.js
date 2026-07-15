import api from "../lib/api";

/**
 * Auth Service — all auth-related HTTP calls through Axios
 */

// POST /api/v1/user/register
export const registerApi = (data) =>
  api.post("/api/v1/user/register", data);

// POST /api/v1/user/login
export const loginApi = (data) =>
  api.post("/api/v1/user/login", data);

// POST /api/v1/user/logout
export const logoutApi = () =>
  api.post("/api/v1/user/logout");

// GET /api/v1/user/profile
export const getProfileApi = () =>
  api.get("/api/v1/user/profile");

// PATCH /api/v1/user/profile
export const updateProfileApi = (data) =>
  api.patch("/api/v1/user/profile", data);

// POST /api/v1/user/refreshtoken
export const refreshTokenApi = () =>
  api.post("/api/v1/user/refreshtoken");
