import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 - redirect to login
    // Note: Cookie clearing is handled server-side in lib/auth.ts since cookies are HttpOnly
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const currentPath = window.location.pathname;

      // Don't redirect if already on login page to avoid loops
      if (!currentPath.includes("/login")) {
        const locale = currentPath.split("/")[1];
        const validLocale = ["en", "th"].includes(locale) ? locale : "en";
        window.location.href = `/${validLocale}/login`;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
