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
  prescription_id?: string;
  created_at: string;
  updated_at: string;
  vet_details?: {
    full_name: string;
    email: string;
    specialisation?: string;
    clinic_name?: string;
    experience_years?: number;
  };
  pet_details?: {
    name: string;
    species: string;
    breed?: string;
    dob?: string;
    weight?: number;
    photo_url?: string;
  };
}

export interface AppointmentBook {
  vet_id: string;
  pet_id: string;
  date: string;
  time_slot: string;
  reason: string;
}

export const bookAppointment = async (data: AppointmentBook): Promise<Appointment> => {
  const res = await api.post("/appointments/book", data);
  return res.data;
};

export const getUserAppointments = async (page = 1, status?: string): Promise<{ items: Appointment[]; total: number; pages: number }> => {
  const params: any = { page };
  if (status && status !== "all") params.status = status;
  const res = await api.get("/appointments/user", { params });
  return res.data;
};

export const cancelAppointment = async (id: string): Promise<Appointment> => {
  const res = await api.put(`/appointments/${id}/status`, { status: "cancelled" });
  return res.data;
};
