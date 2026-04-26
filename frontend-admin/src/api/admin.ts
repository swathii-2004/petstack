import api from "./axios";
import { PendingUser, AnalyticsOverview, PaginatedUsers, User, PaginatedOrders } from "../types";

export const adminApi = {
  getPendingApplications: async (role: "vet" | "seller"): Promise<PendingUser[]> => {
    const { data } = await api.get<PendingUser[]>(`/admin/pending?role=${role}`);
    return data;
  },

  approveUser: async (userId: string): Promise<any> => {
    const { data } = await api.put(`/admin/approve/${userId}`);
    return data;
  },

  rejectUser: async (userId: string, reason: string): Promise<any> => {
    const { data } = await api.put(`/admin/reject/${userId}`, { reason });
    return data;
  },

  getUsers: async (params: { role?: string; search?: string; page?: number }): Promise<PaginatedUsers> => {
    const { data } = await api.get<PaginatedUsers>("/admin/users", { params });
    return data;
  },

  deactivateUser: async (userId: string): Promise<User> => {
    const { data } = await api.put<User>(`/admin/users/${userId}/deactivate`);
    return data;
  },

  reactivateUser: async (userId: string): Promise<User> => {
    const { data } = await api.put<User>(`/admin/users/${userId}/reactivate`);
    return data;
  },

  getAnalyticsOverview: async (): Promise<AnalyticsOverview> => {
    const { data } = await api.get<AnalyticsOverview>("/admin/analytics/overview");
    return data;
  },

  getAllOrders: async (params: { page?: number; limit?: number; status?: string }): Promise<PaginatedOrders> => {
    const { data } = await api.get<PaginatedOrders>("/orders/admin", { params });
    return data;
  },
};
