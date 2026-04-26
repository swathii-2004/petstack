import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getVets, getVetAvailability, Vet, VetAvailability } from "../../api/vets";
import { getMyPets, Pet } from "../../api/pets";
import { bookAppointment } from "../../api/appointments";
import { toast } from "sonner";

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

  const [selectedPet, setSelectedPet] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!vetId) return;
    Promise.all([
      getVets(),
      getVetAvailability(vetId),
      getMyPets()
    ]).then(([vets, avail, myPets]) => {
      setVet(vets.find(v => v._id === vetId) || null);
      setAvailability(avail);
      setPets(myPets);
    }).catch(() => toast.error("Failed to load booking info"))
      .finally(() => setLoading(false));
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
      toast.info("Vet is not available on this day");
      return;
    }
    // Check blocked dates
    if (availability.blocked_dates.includes(selectedDate)) {
      setAvailableSlots([]);
      toast.info("Vet has blocked this date");
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
      await bookAppointment({
        vet_id: vetId,
        pet_id: selectedPet,
        date: selectedDate,
        time_slot: selectedSlot,
        reason
      });
      toast.success("Appointment booked successfully!");
      navigate("/appointments");
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to book appointment";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center text-gray-500 py-20">Loading...</div>;
  if (!vet) return <div className="text-center text-gray-500 py-20">Vet not found.</div>;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-2xl mx-auto p-6 mt-6">
      <button onClick={() => navigate("/vets")} className="text-indigo-600 text-sm mb-4 hover:underline">← Back to Vets</button>

      <div className="bg-white border rounded-lg p-5 mb-6 flex items-center gap-4 shadow-sm">
        <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600">
          {vet.full_name.charAt(0)}
        </div>
        <div>
          <p className="font-bold text-lg">{vet.full_name}</p>
          <p className="text-sm text-gray-500">{vet.specialisation || "General Veterinarian"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 shadow-sm space-y-5">
        <h2 className="text-lg font-semibold">Book an Appointment</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Select Pet *</label>
          {pets.length === 0 ? (
            <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
              You have no pets. <a href="/pets" className="underline font-medium">Add a pet first →</a>
            </div>
          ) : (
            <select
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedPet}
              onChange={e => setSelectedPet(e.target.value)}
            >
              <option value="">-- Select a pet --</option>
              {pets.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Appointment Date *</label>
          <input
            type="date"
            min={today}
            className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>

        {selectedDate && (
          <div>
            <label className="block text-sm font-medium mb-2">Available Time Slots *</label>
            {availableSlots.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">No slots available for this date.</p>
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

        <div>
          <label className="block text-sm font-medium mb-1">Reason for Visit *</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
            placeholder="Describe the reason for this appointment..."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || pets.length === 0}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Booking..." : "Confirm Appointment"}
        </button>
      </form>
    </div>
  );
}
