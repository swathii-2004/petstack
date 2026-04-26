import api from "./axios";

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export interface PrescriptionCreate {
  appointment_id: string;
  medicines: Medicine[];
  general_notes?: string;
  recommended_product_ids: string[];
}

export interface PrescriptionResponse {
  _id: string;
  appointment_id: string;
  vet_id: string;
  user_id: string;
  pet_id: string;
  medicines: Medicine[];
  general_notes?: string;
  recommended_product_ids: string[];
  pdf_url: string;
  created_at: string;
}

export const createPrescription = async (data: PrescriptionCreate): Promise<PrescriptionResponse> => {
  const response = await api.post("/prescriptions", data);
  return response.data;
};

export const getPrescription = async (id: string): Promise<PrescriptionResponse> => {
  const response = await api.get(`/prescriptions/${id}`);
  return response.data;
};
