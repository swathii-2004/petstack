export interface User {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  role: "user" | "vet" | "seller" | "admin";
  status: "active" | "pending" | "rejected" | "deactivated";
}

export interface AuthResponse {
  access_token: string;
  user: User;
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
  total_revenue: number;
  chart_data: Array<{
    name: string;
    revenue: number;
    users: number;
  }>;
}

export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface OrderItem {
  product_id: string;
  seller_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
}

export interface PaginatedOrders {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}