import api from "./axios";

export interface OrderItem {
  product_id: string;
  seller_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface OrderCreate {
  items: OrderItem[];
  delivery_address: string;
}

export interface StripeVerify {
  session_id: string;
  order_id: string;
}

export const createOrder = async (payload: OrderCreate) => {
  const response = await api.post("/orders/create", payload);
  return response.data;
};

export const verifyStripe = async (payload: StripeVerify) => {
  const response = await api.post("/orders/verify-stripe", payload);
  return response.data;
};

export interface RazorpayOrderPayload {
  order_id: string;
}

export interface RazorpayVerifyPayload {
  petstack_order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const createRazorpayOrder = async (payload: RazorpayOrderPayload) => {
  const response = await api.post("/orders/create-razorpay-order", payload);
  return response.data;
};

export const verifyRazorpay = async (payload: RazorpayVerifyPayload) => {
  const response = await api.post("/orders/verify-razorpay", payload);
  return response.data;
};

export const getUserOrders = async (page: number = 1) => {
  const response = await api.get(`/orders/user?page=${page}`);
  return response.data;
};
