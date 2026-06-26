import api from "./axios";

export interface SellerReview {
  id: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  image_urls: string[];
  created_at: string;
}

export const getSellerReviews = async (): Promise<SellerReview[]> => {
  const res = await api.get<SellerReview[]>("/reviews/seller");
  return res.data;
};
