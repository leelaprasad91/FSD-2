import axios from "axios";
import { mockLogin, mockRefresh, mockProtectedData } from "./mockBackend.js";

// A custom axios adapter that routes requests to our mock backend instead
// of a real network. This lets us use genuine axios.interceptors exactly
// as described in the PDF ("Axios Interceptors and Secure API
// Communication") without requiring an actual server for the experiment.
async function mockAdapter(config) {
  try {
    let data;
    if (config.url === "/login" && config.method === "post") {
      data = await mockLogin(config.data.username, config.data.password);
    } else if (config.url === "/refresh" && config.method === "post") {
      data = await mockRefresh(config.data.refreshToken);
    } else if (config.url === "/protected-data" && config.method === "get") {
      const authHeader = config.headers?.Authorization || "";
      const token = authHeader.replace("Bearer ", "");
      data = await mockProtectedData(token);
    } else {
      const err = new Error(`No mock route for ${config.method?.toUpperCase()} ${config.url}`);
      err.status = 404;
      throw err;
    }
    return {
      data,
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  } catch (err) {
    const status = err.status || 500;
    const axiosLikeError = new Error(err.message);
    axiosLikeError.config = config;
    axiosLikeError.response = {
      status,
      statusText: status === 401 ? "Unauthorized" : "Error",
      data: { message: err.message },
      headers: {},
      config,
    };
    throw axiosLikeError;
  }
}

export const api = axios.create({
  baseURL: "/api",
  adapter: mockAdapter,
});

// --- Request interceptor: attach access token to every outgoing request ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response interceptor: on 401, refresh the token once and retry ---
let isRefreshing = false;
let pendingQueue = [];

function processQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== "/refresh") {
      if (isRefreshing) {
        // Queue this request until the in-flight refresh completes.
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest._retry = true;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const { data } = await api.post("/refresh", { refreshToken });
        localStorage.setItem("accessToken", data.accessToken);
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("session-expired"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
