import React, { useEffect, useState } from "react";
import { getUserAppointments, cancelAppointment, Appointment } from "../../api/appointments";
import { getPrescription } from "../../api/prescriptions";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_ICONS: Record<string, string> = {
  pending: "⏳",
  accepted: "✅",
  completed: "🎉",
  rejected: "❌",
  cancelled: "🚫",
};

interface CancelModal {
  appointmentId: string;
  date: string;
  time: string;
  reason: string;
}

export default function UserAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [cancelModal, setCancelModal] = useState<CancelModal | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await getUserAppointments(1, filter !== "all" ? filter : undefined);
      setAppointments(data.items);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, [filter]);

  const openCancelModal = (appt: Appointment) => {
    setCancelModal({ appointmentId: appt.id, date: appt.date, time: appt.time_slot, reason: "" });
    setCancelReason("");
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    try {
      await cancelAppointment(cancelModal.appointmentId);
      toast.success("Appointment cancelled successfully.");
      setCancelModal(null);
      fetchAppointments();
    } catch {
      toast.error("Failed to cancel appointment. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const filters = ["all", "pending", "accepted", "completed", "rejected", "cancelled"];

  const handleDownloadPrescription = async (prescriptionId: string) => {
    try {
      const presc = await getPrescription(prescriptionId);
      if (presc.pdf_url) {
        window.open(presc.pdf_url, "_blank");
      }
    } catch {
      toast.error("Failed to fetch prescription");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 mt-6">
      <h1 className="text-2xl font-bold mb-6">My Appointments</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize border transition ${
              filter === f ? "bg-ps-dark text-white border-ps-green" : "bg-white text-gray-600 border-gray-300 hover:border-ps-green"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-red-50 border-b border-red-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-xl">🚫</div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Cancel Appointment</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
            </div>

            {/* Appointment Summary */}
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>📅</span>
                <span className="font-medium">{cancelModal.date}</span>
                <span className="text-gray-400">·</span>
                <span>🕐</span>
                <span className="font-medium">{cancelModal.time}</span>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400 outline-none resize-none text-gray-700 placeholder-gray-400"
                rows={3}
                placeholder="e.g. My pet is feeling better, schedule conflict, etc."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3 text-sm text-amber-800">
                ⚠️ The vet will be notified that this appointment has been cancelled.
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition text-sm"
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel Appointment"}
              </button>
              <button
                onClick={() => setCancelModal(null)}
                disabled={cancelling}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-50 transition text-sm"
              >
                Keep Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center text-gray-400 py-16">
          <div className="animate-spin text-3xl mb-3">⏳</div>
          <p>Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-xl border">
          <p className="text-5xl mb-4">📅</p>
          <p className="font-semibold text-gray-700">No appointments found.</p>
          <p className="text-sm text-gray-400 mt-1">Try a different filter or book a new one.</p>
          <a href="/vets" className="inline-block mt-4 bg-ps-dark text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-ps-darker">
            Browse Vets →
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(appt => (
            <div
              key={appt.id}
              className={`bg-white border rounded-xl p-5 shadow-sm transition ${
                appt.status === "cancelled" || appt.status === "rejected" ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Date / Time / Status Row */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-bold text-gray-900">{appt.date}</span>
                    <span className="text-gray-400">·</span>
                    <span className="font-semibold text-gray-700">{appt.time_slot}</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${STATUS_COLORS[appt.status]}`}>
                      {STATUS_ICONS[appt.status]} {appt.status}
                    </span>
                  </div>

                  {/* Reason */}
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium text-gray-700">Reason:</span> {appt.reason}
                  </p>

                  {/* Vet note (rejection/note) */}
                  {appt.vet_note && (
                    <div className={`mt-2 text-sm px-3 py-2 rounded-lg border ${
                      appt.status === "rejected" ? "bg-red-50 border-red-100 text-red-700" : "bg-ps-green-pale border-ps-green-pale text-ps-green"
                    }`}>
                      <span className="font-semibold">Vet's note: </span>{appt.vet_note}
                    </div>
                  )}
                </div>
              </div>

              {/* Cancel Button */}
              {(appt.status === "pending" || appt.status === "accepted") && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {appt.status === "pending" ? "Awaiting vet confirmation" : "Appointment confirmed"}
                  </p>
                  <button
                    onClick={() => openCancelModal(appt)}
                    className="text-sm text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 px-4 py-1.5 rounded-lg font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
              
              {/* Chat Button for accepted appointments */}
              {appt.status === "accepted" && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => navigate(`/chat/${appt.id}`)}
                    className="text-sm bg-ps-green-pale text-ps-green hover:bg-ps-green-pale border border-ps-green-pale px-4 py-1.5 rounded-lg font-medium transition flex items-center gap-2"
                  >
                    💬 Chat with Vet
                  </button>
                </div>
              )}
              {appt.status === "completed" && appt.prescription_id && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => handleDownloadPrescription(appt.prescription_id!)}
                    className="text-sm bg-ps-green-pale text-ps-green hover:bg-ps-green-pale border border-ps-green-pale px-4 py-1.5 rounded-lg font-medium transition flex items-center gap-2"
                  >
                    📄 Download Prescription
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
