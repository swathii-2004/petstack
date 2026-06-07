import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false, // Clerk uses Bearer tokens, not cookies
});

/**
 * Call this helper to attach a Clerk token to the Axios instance before a request.
 * Usage in components:
 *   const { getToken } = useAuth();
 *   setAxiosToken(await getToken());
 *   const data = await api.get("/endpoint");
 */
export function setAxiosToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

export default api;