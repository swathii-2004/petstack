import React, { useEffect, useState } from "react";
import { getMyAvailability, updateMyAvailability, VetAvailability, WeeklySchedule } from "../../api/appointments";
import { toast } from "sonner";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

const defaultSchedule: WeeklySchedule = {
  monday: { is_working: true, start_time: "09:00", end_time: "17:00" },
  tuesday: { is_working: true, start_time: "09:00", end_time: "17:00" },
  wednesday: { is_working: true, start_time: "09:00", end_time: "17:00" },
  thursday: { is_working: true, start_time: "09:00", end_time: "17:00" },
  friday: { is_working: true, start_time: "09:00", end_time: "17:00" },
  saturday: { is_working: false, start_time: "09:00", end_time: "13:00" },
  sunday: { is_working: false, start_time: "09:00", end_time: "13:00" },
};

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<VetAvailability>({
    schedule: defaultSchedule,
    blocked_dates: [],
    slot_duration_minutes: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState("");

  useEffect(() => {
    getMyAvailability()
      .then(data => setAvailability(data))
      .catch(() => {}) // use defaults
      .finally(() => setLoading(false));
  }, []);

  const updateDay = (day: typeof DAYS[number], field: string, value: any) => {
    setAvailability(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: { ...prev.schedule[day], [field]: value }
      }
    }));
  };

  const addBlockedDate = () => {
    if (!newBlockedDate) return;
    if (availability.blocked_dates.includes(newBlockedDate)) return toast.error("Date already blocked");
    setAvailability(prev => ({
      ...prev,
      blocked_dates: [...prev.blocked_dates, newBlockedDate].sort()
    }));
    setNewBlockedDate("");
  };

  const removeBlockedDate = (date: string) => {
    setAvailability(prev => ({
      ...prev,
      blocked_dates: prev.blocked_dates.filter(d => d !== date)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMyAvailability(availability);
      toast.success("Availability saved!");
    } catch {
      toast.error("Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Availability</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Slot Duration */}
      <div className="bg-white border rounded-lg p-5 mb-5 shadow-sm">
        <label className="block text-sm font-medium mb-2">Appointment Duration (minutes)</label>
        <select
          className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          value={availability.slot_duration_minutes}
          onChange={e => setAvailability(prev => ({ ...prev, slot_duration_minutes: Number(e.target.value) }))}
        >
          {[15, 20, 30, 45, 60].map(d => <option key={d} value={d}>{d} minutes</option>)}
        </select>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white border rounded-lg p-5 mb-5 shadow-sm">
        <h2 className="font-semibold mb-4">Weekly Schedule</h2>
        <div className="space-y-3">
          {DAYS.map(day => {
            const dayData = availability.schedule[day];
            return (
              <div key={day} className="flex items-center gap-4">
                <div className="w-28">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dayData.is_working}
                      onChange={e => updateDay(day, "is_working", e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium capitalize">{day}</span>
                  </label>
                </div>
                {dayData.is_working && (
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="time"
                      value={dayData.start_time}
                      onChange={e => updateDay(day, "start_time", e.target.value)}
                      className="border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={dayData.end_time}
                      onChange={e => updateDay(day, "end_time", e.target.value)}
                      className="border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
                {!dayData.is_working && <span className="text-sm text-gray-400">Day off</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Blocked Dates */}
      <div className="bg-white border rounded-lg p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Blocked / Holiday Dates</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="date"
            value={newBlockedDate}
            onChange={e => setNewBlockedDate(e.target.value)}
            className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={addBlockedDate}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700"
          >
            Block Date
          </button>
        </div>
        {availability.blocked_dates.length === 0 ? (
          <p className="text-sm text-gray-400">No blocked dates.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availability.blocked_dates.map(date => (
              <span key={date} className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-sm">
                {date}
                <button onClick={() => removeBlockedDate(date)} className="ml-1 hover:text-red-900 font-bold">×</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
