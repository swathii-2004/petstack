export interface User {
  id: string;
  name: string;
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