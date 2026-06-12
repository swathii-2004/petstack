import React, { useEffect, useState } from "react";
import { getMyPets, createPet, deletePet, updatePet, Pet } from "../../api/pets";
import { toast } from "sonner";
import { 
  PawPrint, 
  Trash2, 
  Edit3, 
  Calendar, 
  Weight, 
  Plus, 
  Loader2,
  X,
  FileText,
  Activity,
  Syringe,
  Pill
} from "lucide-react";
import { getPetPrescriptions, PrescriptionResponse } from "../../api/prescriptions";

const SPECIES_OPTIONS = ["Dog", "Cat", "Bird", "Rabbit", "Fish", "Hamster", "Other"];

export default function MyPetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Dog");
  const [breed, setBreed] = useState("");
  const [dob, setDob] = useState("");
  const [weight, setWeight] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  
  // Editing state
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Modal State
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [petPrescriptions, setPetPrescriptions] = useState<PrescriptionResponse[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  const fetchPets = async () => {
    try {
      const data = await getMyPets();
      setPets(data);
    } catch {
      toast.error("Failed to load pets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPets(); }, []);

  const resetForm = () => {
    setName("");
    setSpecies("Dog");
    setBreed("");
    setDob("");
    setWeight("");
    setPhoto(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Pet name is required");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("species", species);
      if (breed) formData.append("breed", breed);
      if (dob) formData.append("dob", dob);
      if (weight) formData.append("weight", weight);
      if (photo) formData.append("photo", photo);

      await createPet(formData);
      toast.success("Pet added!");
      setShowForm(false);
      resetForm();
      fetchPets();
    } catch {
      toast.error("Failed to add pet");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (pet: Pet) => {
    setEditingPetId(pet.id);
    setName(pet.name);
    setSpecies(pet.species);
    setBreed(pet.breed || "");
    setDob(pet.dob || "");
    setWeight(pet.weight ? pet.weight.toString() : "");
    setPhoto(null); // photo needs to be re-uploaded if they want to change it
    setSelectedPet(null); // close modal
    setShowForm(true); // open form
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Pet name is required");
    if (!editingPetId) return;
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("species", species);
      if (breed) formData.append("breed", breed);
      if (dob) formData.append("dob", dob);
      if (weight) formData.append("weight", weight);
      if (photo) formData.append("photo", photo);

      await updatePet(editingPetId, formData);
      toast.success("Pet details updated!");
      setEditingPetId(null);
      setShowForm(false);
      resetForm();
      fetchPets();
    } catch {
      toast.error("Failed to update pet");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (petId: string, petName: string) => {
    if (!confirm(`Remove ${petName} from your pets?`)) return;
    try {
      await deletePet(petId);
      toast.success("Pet removed");
      if (selectedPet?.id === petId) setSelectedPet(null);
      fetchPets();
    } catch {
      toast.error("Failed to remove pet");
    }
  };

  const handleSelectPet = async (pet: Pet) => {
    setSelectedPet(pet);
    setLoadingPrescriptions(true);
    try {
      const prescs = await getPetPrescriptions(pet.id);
      setPetPrescriptions(prescs);
    } catch {
      toast.error("Failed to load health records");
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 mt-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-serif text-ps-dark">My Pets</h1>
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setEditingPetId(null);
              setShowForm(true);
            }}
            className="bg-ps-dark text-white px-5 py-2.5 rounded-lg font-medium hover:bg-ps-darker flex items-center gap-2 transition text-sm shadow-md"
          >
            <Plus size={18} /> Add Pet
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border rounded-2xl p-8 mb-8 shadow-md">
          <h2 className="text-xl font-bold text-ps-dark mb-6 font-serif">
            {editingPetId ? "Edit Pet Details" : "Add a New Pet"}
          </h2>
          <form onSubmit={editingPetId ? handleUpdate : handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pet Name *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Buddy"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Species *</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ps-green outline-none bg-white"
                  value={species}
                  onChange={e => setSpecies(e.target.value)}
                >
                  {SPECIES_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Breed</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                  value={breed}
                  onChange={e => setBreed(e.target.value)}
                  placeholder="e.g. Golden Retriever"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="e.g. 12.5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-ps-green outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-ps-green/10 file:text-ps-green hover:file:bg-ps-green/20 cursor-pointer"
                  onChange={e => setPhoto(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={submitting || updating}
                className="bg-ps-dark text-white px-6 py-2.5 rounded-lg font-medium hover:bg-ps-darker disabled:opacity-50 transition text-sm"
              >
                {submitting || updating ? "Saving..." : (editingPetId ? "Update Pet" : "Save Pet")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingPetId(null);
                }}
                className="border border-gray-300 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition text-sm text-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-20 flex flex-col items-center">
          <Loader2 className="animate-spin text-ps-green w-10 h-10 mb-4" />
          <p className="text-lg">Loading your furry friends...</p>
        </div>
      ) : pets.length === 0 && !showForm ? (
        <div className="text-center text-gray-500 py-24 bg-white rounded-3xl border border-gray-100 flex flex-col items-center justify-center shadow-sm">
          <div className="text-gray-200 mb-5 flex justify-center"><PawPrint size={64} /></div>
          <p className="font-bold text-gray-800 text-xl">No pets yet.</p>
          <p className="text-gray-500 mt-2">Add your first pet to complete your profile!</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-6 bg-ps-green text-white px-6 py-2.5 rounded-lg font-medium hover:bg-ps-green-dark transition shadow-md"
          >
            Add a Pet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map(pet => (
            <div 
              key={pet.id} 
              className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group flex flex-col"
              onClick={() => handleSelectPet(pet)}
            >
              <div className="h-48 w-full bg-gray-100 relative overflow-hidden">
                {pet.photo_url ? (
                  <img
                    src={pet.photo_url}
                    alt={pet.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 group-hover:text-ps-green transition">
                    <PawPrint size={48} />
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-ps-dark shadow-sm">
                  {pet.species}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-xl text-gray-900 mb-1">{pet.name}</h3>
                
                <div className="space-y-2 mt-3 flex-1">
                  {pet.breed && (
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-ps-green"></span>
                      {pet.breed}
                    </div>
                  )}
                  {pet.weight && (
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <Weight size={14} className="text-gray-400" />
                      {pet.weight} kg
                    </div>
                  )}
                  {pet.dob && (
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(pet.dob).toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleStartEdit(pet)}
                    className="p-2 text-gray-500 hover:text-ps-green hover:bg-ps-green/10 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(pet.id, pet.name)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Remove"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pet Details Modal */}
      {selectedPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedPet(null)}>
          <div 
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedPet(null)}
              className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-gray-100 rounded-full z-10 transition backdrop-blur-md"
            >
              <X size={20} className="text-gray-600" />
            </button>

            <div className="h-64 w-full bg-gray-100 relative">
              {selectedPet.photo_url ? (
                <img
                  src={selectedPet.photo_url}
                  alt={selectedPet.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <PawPrint size={80} />
                </div>
              )}
            </div>

            <div className="p-8">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold font-serif text-gray-900">{selectedPet.name}</h2>
                  <p className="text-ps-green font-medium mt-1">{selectedPet.breed || selectedPet.species}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { handleStartEdit(selectedPet); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                  >
                    <Edit3 size={16} /> Edit
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Species</p>
                  <p className="font-medium text-gray-900">{selectedPet.species}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Weight</p>
                  <p className="font-medium text-gray-900">{selectedPet.weight ? `${selectedPet.weight} kg` : '--'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Age</p>
                  <p className="font-medium text-gray-900">
                    {selectedPet.dob ? (
                      `${Math.floor((new Date().getTime() - new Date(selectedPet.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} yrs`
                    ) : '--'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Born</p>
                  <p className="font-medium text-gray-900">{selectedPet.dob ? new Date(selectedPet.dob).toLocaleDateString() : '--'}</p>
                </div>
              </div>

              <div className="space-y-6">
                {loadingPrescriptions ? (
                  <div className="py-8 flex flex-col items-center justify-center text-gray-400">
                    <Loader2 className="animate-spin w-8 h-8 text-ps-green mb-3" />
                    <p>Loading medical records...</p>
                  </div>
                ) : petPrescriptions.length === 0 ? (
                  <div className="bg-gray-50 border rounded-xl p-8 text-center">
                    <div className="flex justify-center mb-4 text-gray-300"><FileText size={48} /></div>
                    <p className="text-gray-600 font-medium text-lg">No medical records yet.</p>
                    <p className="text-sm text-gray-500 mt-2">Health records and prescriptions will appear here after vet appointments.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                      <Activity size={22} className="text-ps-green" />
                      Veterinary Records
                    </h3>
                    
                    {petPrescriptions.map(presc => (
                      <div key={presc._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              Appointment Date: {new Date(presc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {presc.pdf_url && (
                            <a 
                              href={presc.pdf_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-ps-green hover:text-ps-green-dark text-sm font-medium flex items-center gap-1.5 bg-ps-green/10 px-3 py-1.5 rounded-lg transition"
                            >
                              <FileText size={16} /> View Original PDF
                            </a>
                          )}
                        </div>
                        
                        <div className="p-6">
                          {presc.general_notes && (
                            <div className="mb-6">
                              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <FileText size={16} className="text-gray-400" /> Vet Notes
                              </h4>
                              <p className="text-gray-700 bg-gray-50/50 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
                                {presc.general_notes}
                              </p>
                            </div>
                          )}
                          
                          {presc.medicines && presc.medicines.length > 0 && (
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Pill size={16} className="text-gray-400" /> Prescribed Medicines
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {presc.medicines.map((med, idx) => (
                                  <div key={idx} className="border border-gray-100 bg-white rounded-xl p-4 shadow-sm flex items-start gap-3">
                                    <div className="bg-blue-50 p-2 rounded-lg text-blue-500 mt-0.5">
                                      <Syringe size={18} />
                                    </div>
                                    <div>
                                      <p className="font-bold text-gray-900">{med.name}</p>
                                      <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Dosage:</span> {med.dosage}</p>
                                      <p className="text-sm text-gray-600"><span className="font-medium">Frequency:</span> {med.frequency}</p>
                                      <p className="text-sm text-gray-600"><span className="font-medium">Duration:</span> {med.duration}</p>
                                      {med.notes && <p className="text-sm text-gray-500 mt-2 italic bg-gray-50 p-2 rounded">{med.notes}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
