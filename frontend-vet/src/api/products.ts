import api from "./axios";

export interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  image_urls: string[];
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
}

export const getProducts = async (search?: string): Promise<PaginatedProducts> => {
  const params: Record<string, any> = { limit: 10 };
  if (search) params.search = search;
  const response = await api.get("/products", { params });
  return response.data;
};
