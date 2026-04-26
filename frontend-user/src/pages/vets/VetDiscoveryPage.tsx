import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getVets, Vet } from "../../api/vets";
import { toast } from "sonner";

export default function VetDiscoveryPage() {
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getVets()
      .then(setVets)
      .catch(() => toast.error("Failed to load vets"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = vets.filter(v =>
    v.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (v.specialisation || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-6 mt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Find a Vet</h1>
        <input
          className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Search by name or specialisation..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading vets...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-12 bg-white rounded-lg border">
          <p className="text-4xl mb-3">🩺</p>
          <p className="font-medium">No vets available right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(vet => (
            <div key={vet._id} className="bg-white border rounded-lg p-5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600">
                  {vet.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">{vet.full_name}</p>
                  <p className="text-sm text-gray-500">
                    {vet.specialisation || "General Veterinarian"}
                    {vet.clinic_name ? ` · ${vet.clinic_name}` : ""}
                    {vet.experience_years ? ` · ${vet.experience_years} yrs exp.` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/vets/${vet._id}/book`)}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700"
              >
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
