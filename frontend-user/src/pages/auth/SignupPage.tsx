import { useForm } from "react-hook-form";
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
}