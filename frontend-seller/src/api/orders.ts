import api from "./axios";

export const getSellerOrders = async (page: number = 1, status: string = "all") => {
  const response = await api.get(`/orders/seller?page=${page}&status=${status}`);
  return response.data;
};

export const updateOrderStatus = async (orderId: string, status: string, trackingNumber?: string) => {
  const payload: any = { status };
  if (trackingNumber) {
    payload.tracking_number = trackingNumber;
  }
  const response = await api.put(`/orders/${orderId}/status`, payload);
  return response.data;
};
