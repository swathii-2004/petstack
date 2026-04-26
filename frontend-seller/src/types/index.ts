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

export interface Product {
  _id: string;
  seller_id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  image_urls: string[];
  tags: string[];
  is_active: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  pages: number;
}

export interface SellerProfile {
  _id: string;
  seller_id: string;
  business_name?: string;
  phone?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_account_name?: string;
  updated_at: string;
}