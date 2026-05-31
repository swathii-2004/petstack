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
        if (data && data.items) {
            data.items = data.items.map(item => ({
                ...item,
                _id: item.id || (item as any)._id
            }));
        }
        return data;
    },

    getProduct: async (id: string): Promise<Product> => {
        const { data } = await api.get<Product>(`/products/${id}`);
        if (data) {
            (data as any)._id = data.id || (data as any)._id;
        }
        return data;
    },

    getProductReviews: async (id: string, page: number = 1): Promise<Review[]> => {
        const { data } = await api.get<Review[]>(`/reviews/product/${id}`, {
            params: { page },
        });
        return data;
    },
};
