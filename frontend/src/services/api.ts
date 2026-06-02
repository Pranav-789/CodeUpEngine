import axios from "axios";
import { BASE_URL } from "../utils/constants.ts";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // You can handle 401s here globally if needed, e.g. token refresh
    // For now, we will just reject the promise
    return Promise.reject(error);
  }
);
