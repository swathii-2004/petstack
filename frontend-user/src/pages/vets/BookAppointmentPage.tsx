import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getVetById, getVetAvailability, Vet, VetAvailability } from "../../api/vets";
import { getMyPets, Pet } from "../../api/pets";
import { bookAppointment } from "../../api/appointments";
import { toast } from "sonner";
import { CalendarDays, Clock, PawPrint, FileText, ArrowLeft, AlertCircle } from "lucide-react";

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function generateSlots(startTime: string, endTime: string, duration: number): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;
  while (current + duration <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, "0");
    const m = (current % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += duration;
  }
  return slots;
}

export default function BookAppointmentPage() {
  const { vetId } = useParams<{ vetId: string }>();
  const navigate = useNavigate();

  const [vet, setVet] = useState<Vet | null>(null);
  const [availability, setAvailability] = useState<VetAvailability | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [noPets, setNoPets] = useState(false);

  const [selectedPet, setSelectedPet] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!vetId) return;

    const load = async () => {
      try {
        // Fetch vet directly by ID (not scanning all vets)
        const [vetData, avail, myPets] = await Promise.all([
          getVetById(vetId),
          getVetAvailability(vetId),
          getMyPets(),
        ]);

        setVet(vetData);
        setAvailability(avail);

        if (myPets.length === 0) {
          // No pets — show redirect prompt
          setNoPets(true);
        } else {
          setPets(myPets);
          setSelectedPet(myPets[0].id); // auto-select first pet
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          toast.error("Vet not found");
          navigate("/vets");
        } else {
          toast.error("Failed to load booking info");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [vetId]);

  useEffect(() => {
    if (!selectedDate || !availability) {
      setAvailableSlots([]);
      return;
    }
    const dayIndex = new Date(selectedDate + "T12:00:00").getDay();
    const dayName = DAY_NAMES[dayIndex] as keyof typeof availability.schedule;
    const dayAvail = availability.schedule[dayName];

    if (!dayAvail?.is_working) {
      setAvailableSlots([]);
      toast.info("The vet is not available on this day");
      return;
    }
    if (availability.blocked_dates.includes(selectedDate)) {
      setAvailableSlots([]);
      toast.info("The vet has blocked this date");
      return;
    }
    const slots = generateSlots(dayAvail.start_time, dayAvail.end_time, availability.slot_duration_minutes);
    setAvailableSlots(slots);
    setSelectedSlot("");
  }, [selectedDate, availability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet) return toast.error("Please select a pet");
    if (!selectedDate) return toast.error("Please select a date");
    if (!selectedSlot) return toast.error("Please select a time slot");
    if (!reason.trim()) return toast.error("Please enter a reason for the visit");
    if (!vetId) return;

    setSubmitting(true);
    try {
      await bookAppointment({ vet_id: vetId, pet_id: selectedPet, date: selectedDate, time_slot: selectedSlot, reason });
      toast.success("Appointment booked successfully! 🎉");
      navigate("/appointments");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading booking info...</p>
        </div>
      </div>
    );
  }

  // ── No Pets Redirect Screen ──────────────────────────────────────────────────
  if (noPets && vet) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <PawPrint className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Pets Found</h2>
        <p className="text-gray-500 mb-2">
          You need to add a pet before booking an appointment with <span className="font-semibold text-gray-700">{vet.full_name}</span>.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          After adding your pet, come back and click "Book Appointment" again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/pets")}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
          >
            <PawPrint className="w-4 h-4" />
            Add a Pet Now
          </button>
          <button
            onClick={() => navigate("/vets")}
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Vets
          </button>
        </div>
      </div>
    );
  }

  if (!vet) return null;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Back */}
      <button
        onClick={() => navigate("/vets")}
        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Vets
      </button>

      {/* Vet Card */}
      <div className="bg-white border rounded-xl p-5 mb-6 flex items-center gap-4 shadow-sm">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600 shrink-0">
          {vet.full_name.charAt(0)}
        </div>
        <div>
          <p className="font-bold text-lg text-gray-900">{vet.full_name}</p>
          <p className="text-sm text-gray-500">{vet.specialisation || "General Veterinarian"}</p>
          {vet.clinic_name && <p className="text-sm text-gray-400">{vet.clinic_name}</p>}
        </div>
      </div>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-gray-900">Book an Appointment</h2>

        {/* Pet Selector */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
            <PawPrint className="w-4 h-4 text-indigo-500" /> Select Pet *
          </label>
          <select
            className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            value={selectedPet}
            onChange={e => setSelectedPet(e.target.value)}
          >
            {pets.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
            ))}
          </select>
        </div>

        {/* Date Picker */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
            <CalendarDays className="w-4 h-4 text-indigo-500" /> Appointment Date *
          </label>
          <input
            type="date"
            min={today}
            className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <Clock className="w-4 h-4 text-indigo-500" /> Available Time Slots *
            </label>
            {availableSlots.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                No slots available for this date. Please try another day.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition ${
                      selectedSlot === slot
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-indigo-400"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
            <FileText className="w-4 h-4 text-indigo-500" /> Reason for Visit *
          </label>
          <textarea
            className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            rows={3}
            placeholder="e.g. Annual vaccination, skin irritation, weight check..."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !selectedSlot || !reason.trim()}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {submitting ? "Booking..." : "✓ Confirm Appointment"}
        </button>
      </form>
    </div>
  );
}
