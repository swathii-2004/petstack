import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false, // Clerk uses Bearer tokens, not cookies
});

export default api;