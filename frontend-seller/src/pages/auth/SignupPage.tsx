import { useForm } from "react-hook-form";
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
}