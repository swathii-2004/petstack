import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getVets, Vet } from "../../api/vets";
import { toast } from "sonner";
import { Search, Stethoscope, CalendarPlus, Building2, Clock } from "lucide-react";

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
    <div className="p-8 font-sans">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-ps-text-dark mb-1">Find a Vet</h1>
        <p className="text-ps-text-mid text-[14px] mb-5">Connect with trusted veterinary professionals</p>
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ps-text-mid" />
          <input
            className="w-full h-11 pl-10 pr-4 border border-ps-cream-2 rounded-xl text-[14px] bg-white outline-none focus:border-ps-green focus:ring-4 focus:ring-ps-green/10 transition-all placeholder:text-gray-300"
            placeholder="Search by name or specialisation..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white animate-pulse rounded-2xl border border-ps-cream-2" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-ps-cream-2">
          <div className="w-16 h-16 bg-ps-cream rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Stethoscope size={28} className="text-ps-text-mid" />
          </div>
          <p className="font-semibold text-ps-text-dark text-lg">No vets found</p>
          <p className="text-ps-text-mid text-sm mt-1">Try a different search term.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(vet => (
            <div key={vet._id}
              className="bg-white border border-ps-cream-2 rounded-2xl p-5 flex items-center justify-between hover:border-ps-green hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-ps-green-pale rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Stethoscope size={20} className="text-ps-green" />
                </div>
                <div>
                  <p className="font-semibold text-ps-text-dark text-[15px]">{vet.full_name}</p>
                  <div className="flex items-center gap-3 mt-1 text-[12px] text-ps-text-mid">
                    {vet.specialisation && (
                      <span className="flex items-center gap-1">
                        <Stethoscope size={11} /> {vet.specialisation}
                      </span>
                    )}
                    {vet.clinic_name && (
                      <span className="flex items-center gap-1">
                        <Building2 size={11} /> {vet.clinic_name}
                      </span>
                    )}
                    {vet.experience_years && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {vet.experience_years} yrs exp.
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate(`/vets/${vet._id}/book`)}
                className="flex items-center gap-2 bg-ps-dark text-white px-5 py-2.5 rounded-xl font-semibold text-[13px] hover:bg-ps-darker transition-colors shadow-sm"
              >
                <CalendarPlus size={15} /> Book
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
