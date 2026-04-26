import api from "./axios";

export interface Appointment {
  id: string;
  vet_id: string;
  user_id: string;
  pet_id: string;
  date: string;
  time_slot: string;
  reason: string;
  status: "pending" | "accepted" | "completed" | "rejected" | "cancelled";
  vet_note?: string;
  created_at: string;
  updated_at: string;
}

export const getVetAppointments = async (page = 1, status?: string): Promise<{ items: Appointment[]; total: number; pages: number }> => {
  const params: any = { page };
  if (status && status !== "all") params.status = status;
  const res = await api.get("/appointments/vet", { params });
  return res.data;
};

export interface VetDashboardStats {
  today_appointments: number;
  pending_requests: number;
  total_completed: number;
}

export const getDashboardStats = async (): Promise<VetDashboardStats> => {
  const res = await api.get("/appointments/vet/dashboard");
  return res.data;
};

export const updateAppointmentStatus = async (id: string, status: string, vet_note?: string): Promise<Appointment> => {
  const res = await api.put(`/appointments/${id}/status`, { status, vet_note });
  return res.data;
};

export interface WeeklySchedule {
  monday: { is_working: boolean; start_time: string; end_time: string };
  tuesday: { is_working: boolean; start_time: string; end_time: string };
  wednesday: { is_working: boolean; start_time: string; end_time: string };
  thursday: { is_working: boolean; start_time: string; end_time: string };
  friday: { is_working: boolean; start_time: string; end_time: string };
  saturday: { is_working: boolean; start_time: string; end_time: string };
  sunday: { is_working: boolean; start_time: string; end_time: string };
}

export interface VetAvailability {
  schedule: WeeklySchedule;
  blocked_dates: string[];
  slot_duration_minutes: number;
}

export const getMyAvailability = async (): Promise<VetAvailability> => {
  const res = await api.get("/vets/me/availability");
  return res.data;
};

export const updateMyAvailability = async (data: VetAvailability): Promise<VetAvailability> => {
  const res = await api.put("/vets/me/availability", data);
  return res.data;
};
