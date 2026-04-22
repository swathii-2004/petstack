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
}