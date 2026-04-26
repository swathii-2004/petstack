import React, { useEffect, useState } from "react";
import { getVetAppointments, updateAppointmentStatus } from "../../api/appointments";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PrescriptionWriter from "./PrescriptionWriter";

interface PetDetails {
  name: string;
  species: string;
  breed?: string;
  dob?: string;
  weight?: number;
}

interface OwnerDetails {
  full_name: string;
  email: string;
  phone?: string;
}

interface Appointment {
  id: string;         // Pydantic maps _id → id; enriched endpoint returns _id as string
  _id?: string;       // raw enriched response
  vet_id: string;
  user_id: string;
  pet_id: string;
  date: string;
  time_slot: string;
  reason: string;
  status: "pending" | "accepted" | "completed" | "rejected" | "cancelled";
  vet_note?: string;
  prescription_id?: string;
  pet_details?: PetDetails;
  owner_details?: OwnerDetails;
  created_at: string;
}

function resolveId(appt: Appointment): string {
  return appt.id || appt._id || "";
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
};

function calcAge(dob?: string): string {
  if (!dob) return "";
  const birth = new Date(dob);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}yr`;
}

export default function VetAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [rejectNote, setRejectNote] = useState<{ id: string; note: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [writerApptId, setWriterApptId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await getVetAppointments(1, filter !== "all" ? filter : undefined);
      setAppointments(data.items as Appointment[]);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, [filter]);

  const handleAction = async (id: string, status: string, note?: string) => {
    try {
      await updateAppointmentStatus(id, status, note);
      toast.success(`Appointment ${status}`);
      setRejectNote(null);
      fetchAppointments();
    } catch {
      toast.error("Failed to update appointment");
    }
  };

  const filters = ["all", "pending", "accepted", "completed", "rejected", "cancelled"];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Appointments</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize border transition ${
              filter === f ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Reject Note Modal */}
      {rejectNote && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="font-semibold text-lg mb-3">Rejection Note</h3>
            <textarea
              className="w-full border rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-red-400 outline-none"
              rows={3}
              placeholder="Enter reason for rejection (will be shown to the owner)..."
              value={rejectNote.note}
              onChange={e => setRejectNote({ ...rejectNote, note: e.target.value })}
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleAction(rejectNote.id, "rejected", rejectNote.note)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => setRejectNote(null)}
                className="border px-4 py-2 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="text-center text-gray-500 py-12 bg-white rounded-lg border">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-medium">No appointments found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map(appt => {
            const apptId = resolveId(appt);
            const isExpanded = expanded === apptId;
            const pet = appt.pet_details;
            const owner = appt.owner_details;
            return (
              <div key={appt.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                {/* Header row */}
                <div
                  className="flex items-start justify-between p-5 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpanded(isExpanded ? null : apptId)}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-gray-900">{appt.date} at {appt.time_slot}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_COLORS[appt.status]}`}>
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {pet ? `${pet.name} (${pet.species})` : "Pet info loading..."}
                      {owner ? ` · Owner: ${owner.full_name}` : ""}
                    </p>
                  </div>
                  <span className="text-gray-400 text-sm mt-1">{isExpanded ? "▲" : "▼"}</span>
                </div>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="border-t px-5 pb-5 pt-4 bg-gray-50">
                    <div className="grid md:grid-cols-2 gap-5 mb-5">
                      {/* Pet Details */}
                      <div className="bg-white border rounded-lg p-4">
                        <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">🐾 Pet Details</h3>
                        {pet ? (
                          <dl className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Name</dt>
                              <dd className="font-medium text-gray-900">{pet.name}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Species</dt>
                              <dd className="font-medium text-gray-900">{pet.species}</dd>
                            </div>
                            {pet.breed && (
                              <div className="flex justify-between">
                                <dt className="text-gray-500">Breed</dt>
                                <dd className="font-medium text-gray-900">{pet.breed}</dd>
                              </div>
                            )}
                            {pet.dob && (
                              <div className="flex justify-between">
                                <dt className="text-gray-500">Age</dt>
                                <dd className="font-medium text-gray-900">{calcAge(pet.dob)} ({pet.dob})</dd>
                              </div>
                            )}
                            {pet.weight && (
                              <div className="flex justify-between">
                                <dt className="text-gray-500">Weight</dt>
                                <dd className="font-medium text-gray-900">{pet.weight} kg</dd>
                              </div>
                            )}
                          </dl>
                        ) : (
                          <p className="text-sm text-gray-400">Pet details unavailable</p>
                        )}
                      </div>

                      {/* Owner Details */}
                      <div className="bg-white border rounded-lg p-4">
                        <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">👤 Owner Details</h3>
                        {owner ? (
                          <dl className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Name</dt>
                              <dd className="font-medium text-gray-900">{owner.full_name}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Email</dt>
                              <dd className="font-medium text-gray-900">{owner.email}</dd>
                            </div>
                            {owner.phone && (
                              <div className="flex justify-between">
                                <dt className="text-gray-500">Phone</dt>
                                <dd className="font-medium text-gray-900">{owner.phone}</dd>
                              </div>
                            )}
                          </dl>
                        ) : (
                          <p className="text-sm text-gray-400">Owner details unavailable</p>
                        )}
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="bg-white border rounded-lg p-4 mb-4">
                      <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-2">📋 Reason for Visit</h3>
                      <p className="text-sm text-gray-800">{appt.reason}</p>
                    </div>

                    {/* Vet note if exists */}
                    {appt.vet_note && (
                      <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-700"><span className="font-medium">Your note:</span> {appt.vet_note}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {appt.status === "pending" && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAction(apptId, "accepted")}
                          className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
                        >
                          ✓ Accept Appointment
                        </button>
                        <button
                          onClick={() => setRejectNote({ id: apptId, note: "" })}
                          className="bg-red-50 text-red-600 border border-red-200 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-red-100"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}

                    {appt.status === "accepted" && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAction(apptId, "completed")}
                          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                        >
                          ✓ Mark as Completed
                        </button>
                        <button
                          onClick={() => navigate(`/chat/${apptId}`)}
                          className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-100"
                        >
                          💬 Chat with Owner
                        </button>
                      </div>
                    )}

                    {appt.status === "completed" && (
                      <div className="flex gap-3">
                        {appt.prescription_id ? (
                          <span className="text-sm font-medium text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200 flex items-center gap-2">
                            ✓ Prescription written
                          </span>
                        ) : (
                          <button
                            onClick={() => setWriterApptId(apptId)}
                            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700"
                          >
                            + Write Prescription
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Prescription Writer Modal */}
      <PrescriptionWriter 
        isOpen={!!writerApptId} 
        onClose={() => setWriterApptId(null)} 
        appointmentId={writerApptId || ""} 
        onSuccess={(prescId) => {
          toast.success("Prescription generated successfully!");
          setWriterApptId(null);
          fetchAppointments();
        }}
      />
    </div>
  );
}
