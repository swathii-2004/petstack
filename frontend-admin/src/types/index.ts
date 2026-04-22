export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "vet" | "seller" | "admin";
  status: "active" | "pending" | "rejected" | "deactivated";
}

export interface AuthResponse {
  access_token: string;
  user?: User;
}

export interface ApiError {
  detail: string;
}

export interface PendingUser extends User {
  created_at: string;
  doc_urls: string[];
  license_number?: string;
  business_name?: string;
  clinic_name?: string;
  specialisation?: string;
  gst_number?: string;
}

export interface AnalyticsOverview {
  total_users: number;
  active_users: number;
  pending_vets: number;
  active_vets: number;
  pending_sellers: number;
  active_sellers: number;
  total_products: number;
  total_orders: number;
}

export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}