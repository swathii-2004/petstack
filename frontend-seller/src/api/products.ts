import api from "./axios";
import { Product, PaginatedProducts, SellerProfile } from "../types";

export const productsApi = {
    createProduct: async (formData: FormData): Promise<Product> => {
        const { data } = await api.post<Product>("/products", formData);
        if (data) {
            (data as any)._id = data.id || (data as any)._id;
        }
        return data;
    },

    getMyProducts: async (page: number = 1, limit: number = 20): Promise<PaginatedProducts> => {
        const { data } = await api.get<PaginatedProducts>("/products/mine", {
            params: { page, limit },
        });
        if (data && data.items) {
            data.items = data.items.map(item => ({
                ...item,
                _id: item.id || (item as any)._id
            }));
        }
        return data;
    },

    updateProduct: async (productId: string, formData: FormData): Promise<Product> => {
        const { data } = await api.put<Product>(`/products/${productId}`, formData);
        if (data) {
            (data as any)._id = data.id || (data as any)._id;
        }
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
