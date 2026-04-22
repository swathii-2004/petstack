import os
import sys
import shutil
import subprocess

APPS = ["frontend-user", "frontend-vet", "frontend-seller", "frontend-admin"]

# Define file contents

TSCONFIG_APP_JSON = """{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}"""

VITE_CONFIG_TS = """import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})"""

TAILWIND_CONFIG_TS = """import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config"""

POSTCSS_CONFIG_JS = """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}"""

COMPONENTS_JSON = """{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}"""

INDEX_CSS = """@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}"""

UTILS_TS = """import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}"""

TYPES_INDEX_TS = """export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "vet" | "seller" | "admin";
  status: "active" | "pending" | "rejected" | "deactivated";
}

export interface AuthResponse {
  access_token: string;
  user?: User;
}

export interface ApiError {
  detail: string;
}"""

STORE_AUTHSTORE_TS = """import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
    }
  )
);"""

API_AXIOS_TS = """import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.access_token;
        const user = useAuthStore.getState().user;
        
        // Even if user is null temporarily, we should update the token
        // In PetStack backend, the refresh token might give a new access token
        // We ensure we keep the user if it exists, or just a dummy user if not set
        useAuthStore.getState().setAuth(user || { id: "0", name: "User", email: "", role: "user", status: "active" }, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;"""

COMPONENTS_PROTECTED_ROUTE_TSX = """import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}"""

PAGES_AUTH_LOGIN_PAGE_TSX = """import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import api from "../../api/axios";
import { useAuthStore } from "../../store/authStore";
import { ApiError, AuthResponse } from "../../types";
import { AxiosError } from "axios";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage({ showSignupLink = true }: { showSignupLink?: boolean }) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await api.post<AuthResponse>("/auth/login", data);
      
      const dummyUser = { id: "1", name: "User", email: data.email, role: "user" as const, status: "active" as const };
      
      setAuth(response.data.user || dummyUser, response.data.access_token);
      toast.success("Login successful!");
      navigate("/");
    } catch (error) {
      const e = error as AxiosError<ApiError>;
      const message = e.response?.data?.detail || "Login failed";
      toast.error(message);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register("email")}
              type="email"
              className="w-full border p-2 rounded"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              {...register("password")}
              type="password"
              className="w-full border p-2 rounded"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
        {showSignupLink && (
          <p className="mt-4 text-center text-sm">
            Don't have an account? <Link to="/signup" className="text-blue-600 hover:underline">Sign up</Link>
          </p>
        )}
      </div>
    </div>
  );
}"""

PAGES_AUTH_SIGNUP_PAGE_USER_TSX = """import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import api from "../../api/axios";
import { useAuthStore } from "../../store/authStore";
import { ApiError } from "../../types";
import { AxiosError } from "axios";

const signupSchema = z.object({
  full_name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    try {
      const formData = new FormData();
      formData.append("full_name", data.full_name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("role", "user");

      const response = await api.post("/auth/signup", formData);
      const dummyUser = { id: "1", name: data.full_name, email: data.email, role: "user" as const, status: "active" as const };
      
      setAuth(dummyUser, response.data.access_token);
      toast.success("Registration successful!");
      navigate("/");
    } catch (error) {
      const e = error as AxiosError<ApiError>;
      toast.error(e.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input {...register("full_name")} className="w-full border p-2 rounded" />
            {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input {...register("email")} type="email" className="w-full border p-2 rounded" />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input {...register("password")} type="password" className="w-full border p-2 rounded" />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input {...register("confirmPassword")} type="password" className="w-full border p-2 rounded" />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? "Registering..." : "Sign Up"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}"""

PAGES_AUTH_SIGNUP_PAGE_VET_TSX = """import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "../../api/axios";
import { ApiError } from "../../types";
import { AxiosError } from "axios";

const signupSchema = z.object({
  full_name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password too short"),
  confirmPassword: z.string(),
  license_number: z.string().min(1, "License required"),
  specialisation: z.string().min(1, "Specialisation required"),
  clinic_name: z.string().min(1, "Clinic required"),
  experience_years: z.coerce.number().min(0, "Invalid experience"),
  documents: z.any()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    try {
      const formData = new FormData();
      formData.append("full_name", data.full_name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("role", "vet");
      formData.append("license_number", data.license_number);
      formData.append("specialisation", data.specialisation);
      formData.append("clinic_name", data.clinic_name);
      formData.append("experience_years", data.experience_years.toString());
      
      if (data.documents && data.documents.length > 0) {
        for (let i = 0; i < data.documents.length; i++) {
          formData.append("documents", data.documents[i]);
        }
      }

      await api.post("/auth/signup", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Registration submitted. Awaiting admin approval.");
    } catch (error) {
      const e = error as AxiosError<ApiError>;
      toast.error(e.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12">
      <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Vet Registration</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input {...register("full_name")} className="w-full border p-2 rounded" />
              {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input {...register("email")} type="email" className="w-full border p-2 rounded" />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input {...register("password")} type="password" className="w-full border p-2 rounded" />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input {...register("confirmPassword")} type="password" className="w-full border p-2 rounded" />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">License Number</label>
              <input {...register("license_number")} className="w-full border p-2 rounded" />
              {errors.license_number && <p className="text-red-500 text-sm mt-1">{errors.license_number.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Specialisation</label>
              <input {...register("specialisation")} className="w-full border p-2 rounded" />
              {errors.specialisation && <p className="text-red-500 text-sm mt-1">{errors.specialisation.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Clinic Name</label>
              <input {...register("clinic_name")} className="w-full border p-2 rounded" />
              {errors.clinic_name && <p className="text-red-500 text-sm mt-1">{errors.clinic_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Experience (Years)</label>
              <input {...register("experience_years")} type="number" className="w-full border p-2 rounded" />
              {errors.experience_years && <p className="text-red-500 text-sm mt-1">{errors.experience_years.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Documents (PDF/JPG/PNG, Max 5MB)</label>
            <input {...register("documents")} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="w-full border p-2 rounded" />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already registered? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}"""

PAGES_AUTH_SIGNUP_PAGE_SELLER_TSX = """import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "../../api/axios";
import { ApiError } from "../../types";
import { AxiosError } from "axios";

const signupSchema = z.object({
  full_name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password too short"),
  confirmPassword: z.string(),
  business_name: z.string().min(1, "Business Name required"),
  gst_number: z.string().min(1, "GST required"),
  phone: z.string().min(10, "Valid phone required"),
  documents: z.any()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    try {
      const formData = new FormData();
      formData.append("full_name", data.full_name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("role", "seller");
      formData.append("business_name", data.business_name);
      formData.append("gst_number", data.gst_number);
      formData.append("phone", data.phone);
      
      if (data.documents && data.documents.length > 0) {
        for (let i = 0; i < data.documents.length; i++) {
          formData.append("documents", data.documents[i]);
        }
      }

      await api.post("/auth/signup", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Registration submitted. Awaiting admin approval.");
    } catch (error) {
      const e = error as AxiosError<ApiError>;
      toast.error(e.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12">
      <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Seller Registration</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input {...register("full_name")} className="w-full border p-2 rounded" />
              {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input {...register("email")} type="email" className="w-full border p-2 rounded" />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input {...register("password")} type="password" className="w-full border p-2 rounded" />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input {...register("confirmPassword")} type="password" className="w-full border p-2 rounded" />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Business Name</label>
              <input {...register("business_name")} className="w-full border p-2 rounded" />
              {errors.business_name && <p className="text-red-500 text-sm mt-1">{errors.business_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">GST Number</label>
              <input {...register("gst_number")} className="w-full border p-2 rounded" />
              {errors.gst_number && <p className="text-red-500 text-sm mt-1">{errors.gst_number.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input {...register("phone")} className="w-full border p-2 rounded" />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Documents (Trade License + ID Proof, Max 5MB)</label>
            <input {...register("documents")} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="w-full border p-2 rounded" />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already registered? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}"""

APP_TSX = """import { Routes, Route, Outlet } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
{SIGNUP_IMPORT}

function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Dashboard coming soon</h1>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage {LOGIN_PROPS} />} />
      {SIGNUP_ROUTE}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}"""

MAIN_TSX = """import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);"""

ENV_EXAMPLE = "VITE_API_URL=http://localhost:8000/api/v1"

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def run_cmd(cmd, cwd):
    print(f"Running in {cwd}: {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error executing {cmd} in {cwd}:")
        print(result.stderr)
        sys.exit(1)

def build_app(app_name):
    print(f"\\n--- Setting up {app_name} ---")
    if os.path.exists(app_name):
        shutil.rmtree(app_name)
    
    # Init Vite
    run_cmd(f"npx --yes create-vite@latest {app_name} --template react-ts", cwd=".")
    
    # Dependencies
    deps = [
        "react-router-dom", "@tanstack/react-query", "zustand", "axios", 
        "react-hook-form", "@hookform/resolvers", "zod", "sonner", "lucide-react",
        "clsx", "tailwind-merge", "tailwindcss-animate", "class-variance-authority"
    ]
    dev_deps = [
        "tailwindcss", "postcss", "autoprefixer", "@types/node"
    ]
    
    print("Installing main dependencies...")
    run_cmd("npm install", cwd=app_name)
    run_cmd(f"npm install {' '.join(deps)}", cwd=app_name)
    
    print("Installing dev dependencies...")
    run_cmd(f"npm install -D {' '.join(dev_deps)}", cwd=app_name)

    # Config files
    write_file(f"{app_name}/vite.config.ts", VITE_CONFIG_TS)
    write_file(f"{app_name}/tsconfig.app.json", TSCONFIG_APP_JSON)
    write_file(f"{app_name}/tailwind.config.ts", TAILWIND_CONFIG_TS)
    write_file(f"{app_name}/postcss.config.js", POSTCSS_CONFIG_JS)
    write_file(f"{app_name}/components.json", COMPONENTS_JSON)
    write_file(f"{app_name}/.env.example", ENV_EXAMPLE)

    # .gitignore update
    with open(f"{app_name}/.gitignore", "a") as f:
        f.write("\\n.env\\n")

    # Source files
    write_file(f"{app_name}/src/index.css", INDEX_CSS)
    write_file(f"{app_name}/src/main.tsx", MAIN_TSX)
    write_file(f"{app_name}/src/lib/utils.ts", UTILS_TS)
    write_file(f"{app_name}/src/types/index.ts", TYPES_INDEX_TS)
    write_file(f"{app_name}/src/store/authStore.ts", STORE_AUTHSTORE_TS)
    write_file(f"{app_name}/src/api/axios.ts", API_AXIOS_TS)
    write_file(f"{app_name}/src/components/ProtectedRoute.tsx", COMPONENTS_PROTECTED_ROUTE_TSX)
    
    # Auth files
    if app_name == "frontend-admin":
        write_file(f"{app_name}/src/pages/auth/LoginPage.tsx", PAGES_AUTH_LOGIN_PAGE_TSX.replace('showSignupLink?: boolean', 'showSignupLink?: boolean = false'))
        write_file(f"{app_name}/src/App.tsx", APP_TSX.replace("{SIGNUP_IMPORT}", "").replace("{LOGIN_PROPS}", "showSignupLink={false}").replace("{SIGNUP_ROUTE}", ""))
    else:
        write_file(f"{app_name}/src/pages/auth/LoginPage.tsx", PAGES_AUTH_LOGIN_PAGE_TSX)
        write_file(f"{app_name}/src/App.tsx", APP_TSX.replace("{SIGNUP_IMPORT}", 'import SignupPage from "./pages/auth/SignupPage";').replace("{LOGIN_PROPS}", "").replace("{SIGNUP_ROUTE}", '<Route path="/signup" element={<SignupPage />} />'))
        
        if app_name == "frontend-user":
            write_file(f"{app_name}/src/pages/auth/SignupPage.tsx", PAGES_AUTH_SIGNUP_PAGE_USER_TSX)
        elif app_name == "frontend-vet":
            write_file(f"{app_name}/src/pages/auth/SignupPage.tsx", PAGES_AUTH_SIGNUP_PAGE_VET_TSX)
        elif app_name == "frontend-seller":
            write_file(f"{app_name}/src/pages/auth/SignupPage.tsx", PAGES_AUTH_SIGNUP_PAGE_SELLER_TSX)

if __name__ == "__main__":
    for app in APPS:
        build_app(app)
    print("\\nAll frontends have been successfully scaffolded!")
