import api from "./axios";

export interface Vet {
  _id: string;
  full_name: string;
  email: string;
  specialisation?: string;
  clinic_name?: string;
  experience_years?: number;
  rating?: number;
  review_count?: number;
}

export interface DayAvailability {
  is_working: boolean;
  start_time: string;
  end_time: string;
}

export interface WeeklySchedule {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export interface VetAvailability {
  vet_id: string;
  schedule: WeeklySchedule;
  blocked_dates: string[];
  slot_duration_minutes: number;
  updated_at: string;
}

export interface VetReview {
  id: string;
  vet_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export const getVets = async (): Promise<Vet[]> => {
  const res = await api.get("/vets");
  return res.data;
};

export const getVetById = async (vetId: string): Promise<Vet> => {
  const res = await api.get(`/vets/${vetId}`);
  return res.data;
};

export const getVetAvailability = async (vetId: string): Promise<VetAvailability> => {
  const res = await api.get(`/vets/${vetId}/availability`);
  return res.data;
};

export const getVetReviews = async (vetId: string): Promise<VetReview[]> => {
  const res = await api.get(`/vets/${vetId}/reviews`);
  return res.data;
};

export const createVetReview = async (vetId: string, rating: number, comment: string): Promise<VetReview> => {
  const res = await api.post(`/vets/${vetId}/reviews`, { rating, comment });
  return res.data;
};

export const checkVetReviewEligibility = async (vetId: string): Promise<{ eligible: boolean }> => {
  const res = await api.get(`/vets/${vetId}/reviews/eligibility`);
  return res.data;
};
