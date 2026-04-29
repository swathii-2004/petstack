import os

base_dir = r"c:\Users\HP\Desktop\petstack\proximart"
apps = ["frontend-user", "frontend-vendor", "frontend-admin"]

axios_ts_template = """import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {}, { withCredentials: true });
        const { access_token } = res.data;
        useAuthStore.getState().setToken(access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
"""

authStore_ts_template = """import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => set({ user, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
  setToken: (token) => set({ token }),
}));
"""

protected_route_tsx_template = """import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
"""

for app in apps:
    app_dir = os.path.join(base_dir, app)
    
    with open(os.path.join(app_dir, "src", "lib", "axios.ts"), "w") as f:
        f.write(axios_ts_template)
        
    with open(os.path.join(app_dir, "src", "store", "authStore.ts"), "w") as f:
        f.write(authStore_ts_template)
        
    os.makedirs(os.path.join(app_dir, "src", "components"), exist_ok=True)
    with open(os.path.join(app_dir, "src", "components", "ProtectedRoute.tsx"), "w") as f:
        f.write(protected_route_tsx_template)

print("Shared files generated")
