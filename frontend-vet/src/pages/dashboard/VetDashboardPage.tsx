import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../../api/appointments";
import { Calendar, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export default function VetDashboardPage() {
    const { user } = useAuthStore();
    const { data: stats, isLoading } = useQuery({
        queryKey: ["vet-dashboard-stats"],
        queryFn: getDashboardStats,
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-indigo-50">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, Dr. {user?.full_name?.split(' ')[0] || 'Vet'}! 👋
                </h1>
                <p className="text-gray-500">
                    Here's a quick overview of your appointments and schedule.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Today's Appointments */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar size={64} />
                    </div>
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                            <Calendar size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700">Today's Sessions</h3>
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">
                        {isLoading ? "-" : stats?.today_appointments}
                    </p>
                    <p className="text-sm text-gray-500">Confirmed for today</p>
                </div>

                {/* Pending Requests */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-amber-600">
                        <Clock size={64} />
                    </div>
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                            <Clock size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700">Pending Requests</h3>
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">
                        {isLoading ? "-" : stats?.pending_requests}
                    </p>
                    <p className="text-sm text-amber-600 font-medium">Needs your approval</p>
                </div>

                {/* Total Completed */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-600">
                        <CheckCircle size={64} />
                    </div>
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                            <CheckCircle size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700">Completed</h3>
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">
                        {isLoading ? "-" : stats?.total_completed}
                    </p>
                    <p className="text-sm text-gray-500">Total successful sessions</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <Link to="/appointments" className="block bg-indigo-50 hover:bg-indigo-100 p-6 rounded-2xl transition-colors border border-indigo-100 group">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-bold text-indigo-900">Manage Appointments</h3>
                        <ArrowRight className="text-indigo-600 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-indigo-700">View, accept, or reject incoming appointment requests and manage your active consultations.</p>
                </Link>

                <Link to="/availability" className="block bg-emerald-50 hover:bg-emerald-100 p-6 rounded-2xl transition-colors border border-emerald-100 group">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-bold text-emerald-900">Update Availability</h3>
                        <ArrowRight className="text-emerald-600 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-emerald-700">Set your weekly schedule, define your working hours, and block out dates when you are unavailable.</p>
                </Link>
            </div>
        </div>
    );
}
