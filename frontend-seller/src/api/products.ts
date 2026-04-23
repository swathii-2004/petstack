import api from "./axios";
import { Product, PaginatedProducts, SellerProfile } from "../types";

export const productsApi = {
    createProduct: async (formData: FormData): Promise<Product> => {
        const { data } = await api.post<Product>("/products", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return data;
    },

    getMyProducts: async (page: number = 1, limit: number = 20): Promise<PaginatedProducts> => {
        const { data } = await api.get<PaginatedProducts>("/products/mine", {
            params: { page, limit },
        });
        return data;
    },

    updateProduct: async (productId: string, formData: FormData): Promise<Product> => {
        const { data } = await api.put<Product>(`/products/${productId}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return data;
    },

    deleteProduct: async (productId: string): Promise<void> => {
        await api.delete(`/products/${productId}`);
    },

    getSellerProfile: async (): Promise<SellerProfile> => {
        const { data } = await api.get<SellerProfile>("/sellers/me/profile");
        return data;
    },

    updateSellerProfile: async (payload: Partial<SellerProfile>): Promise<SellerProfile> => {
        const { data } = await api.put<SellerProfile>("/sellers/me/profile", payload);
        return data;
    },
};
