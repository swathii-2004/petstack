import api from "./axios";

export interface VetReview {
  id: string;
  vet_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export const getVetReviews = async (vetId: string): Promise<VetReview[]> => {
  const res = await api.get(`/vets/${vetId}/reviews`);
  return res.data;
};
