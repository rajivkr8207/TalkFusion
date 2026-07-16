import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    timeout: 10000,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

// ─── Request Interceptor ────────────────────────────────────────────────────
api.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
);

// ─── Response Interceptor — auto refresh on 401 ────────────────────────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Attempt to get a new access token using the refresh-token cookie
                await api.post("/api/v1/user/refreshtoken");
                // Retry the original request
                return api(originalRequest);
            } catch {
                // Refresh failed — lazy-import store to avoid circular dependency at module init time
                const { store } = await import("../app/store");
                const { logoutUser } = await import("../features/auth/authSlice");
                store.dispatch(logoutUser());
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

export default api;