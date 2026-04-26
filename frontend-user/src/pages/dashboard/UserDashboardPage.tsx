import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getUserAppointments } from "../../api/appointments";
import { getUserOrders } from "../../api/orders";
import { useAuthStore } from "../../store/authStore";
import { ShoppingBag, Calendar, Activity, ArrowRight, Package } from "lucide-react";

export default function UserDashboardPage() {
    const { user } = useAuthStore();
    
    const { data: appointmentsData, isLoading: isLoadingAppts } = useQuery({
        queryKey: ["user-appointments", 1],
        queryFn: () => getUserAppointments(1, "accepted"),
    });

    const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
        queryKey: ["user-orders", 1],
        queryFn: () => getUserOrders(1),
    });

    const upcomingAppts = appointmentsData?.items?.filter(a => new Date(a.date) >= new Date()) || [];
    const recentOrders = ordersData?.items?.slice(0, 3) || [];

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Activity size={120} />
                </div>
                <h1 className="text-3xl font-bold mb-2 relative z-10">
                    Welcome back, {user?.full_name?.split(' ')[0] || 'Pet Parent'}! 🐾
                </h1>
                <p className="text-indigo-100 max-w-lg relative z-10">
                    Manage your pet's appointments, track your orders, and explore the shop all from your dashboard.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upcoming Appointments */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-50">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <Calendar size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">Upcoming Appointments</h2>
                        </div>
                        <Link to="/appointments" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
                            View All <ArrowRight size={16} className="ml-1" />
                        </Link>
                    </div>

                    {isLoadingAppts ? (
                        <p className="text-gray-500 text-sm">Loading appointments...</p>
                    ) : upcomingAppts.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingAppts.slice(0, 3).map(appt => (
                                <div key={appt.id} className="p-4 border rounded-xl flex justify-between items-center bg-gray-50 hover:bg-indigo-50 transition-colors">
                                    <div>
                                        <p className="font-semibold text-gray-900">{new Date(appt.date).toLocaleDateString()}</p>
                                        <p className="text-sm text-gray-500">{appt.time_slot} for {appt.pet_details?.name || "Pet"}</p>
                                    </div>
                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                        Confirmed
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed">
                            <p className="text-gray-500 mb-4">No upcoming appointments.</p>
                            <Link to="/vets" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                                Find a Vet
                            </Link>
                        </div>
                    )}
                </div>

                {/* Recent Orders */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-50">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                <ShoppingBag size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
                        </div>
                        <Link to="/orders" className="text-sm font-medium text-purple-600 hover:text-purple-800 flex items-center">
                            View All <ArrowRight size={16} className="ml-1" />
                        </Link>
                    </div>

                    {isLoadingOrders ? (
                        <p className="text-gray-500 text-sm">Loading orders...</p>
                    ) : recentOrders.length > 0 ? (
                        <div className="space-y-4">
                            {recentOrders.map(order => (
                                <div key={order.id} className="p-4 border rounded-xl flex items-center justify-between bg-gray-50">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-2 bg-gray-200 rounded text-gray-500">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Order #{order.id.slice(-6)}</p>
                                            <p className="text-sm text-gray-500">{order.items.length} items • ${order.total_amount.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                                        order.status === 'completed' || order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        order.status === 'placed' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed">
                            <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
                            <Link to="/products" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">
                                Start Shopping
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/pets" className="p-4 bg-white border rounded-xl text-center hover:shadow-md transition group">
                    <span className="block text-3xl mb-2 group-hover:scale-110 transition-transform">🐕</span>
                    <span className="font-medium text-gray-800">My Pets</span>
                </Link>
                <Link to="/vets" className="p-4 bg-white border rounded-xl text-center hover:shadow-md transition group">
                    <span className="block text-3xl mb-2 group-hover:scale-110 transition-transform">⚕️</span>
                    <span className="font-medium text-gray-800">Find a Vet</span>
                </Link>
                <Link to="/products" className="p-4 bg-white border rounded-xl text-center hover:shadow-md transition group">
                    <span className="block text-3xl mb-2 group-hover:scale-110 transition-transform">🛍️</span>
                    <span className="font-medium text-gray-800">Shop Supplies</span>
                </Link>
                <Link to="/appointments" className="p-4 bg-white border rounded-xl text-center hover:shadow-md transition group">
                    <span className="block text-3xl mb-2 group-hover:scale-110 transition-transform">📅</span>
                    <span className="font-medium text-gray-800">My Schedule</span>
                </Link>
            </div>
        </div>
    );
}
