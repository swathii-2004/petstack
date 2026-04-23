import api from "./axios";
import { PaginatedProducts, Product, Review } from "../types";

export const productsApi = {
    getProducts: async (params: {
        category?: string;
        search?: string;
        min_price?: number;
        max_price?: number;
        sort?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedProducts> => {
        const { data } = await api.get<PaginatedProducts>("/products", { params });
        return data;
    },

    getProduct: async (id: string): Promise<Product> => {
        const { data } = await api.get<Product>(`/products/${id}`);
        return data;
    },

    getProductReviews: async (id: string, page: number = 1): Promise<Review[]> => {
        const { data } = await api.get<Review[]>(`/reviews/product/${id}`, {
            params: { page },
        });
        return data;
    },
};
