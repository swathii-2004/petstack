import React, { useEffect, useState } from "react";
import { getMyPets, createPet, deletePet, updatePet, Pet, PetCreate } from "../../api/pets";
import { toast } from "sonner";
import { 
  PawPrint, 
  Trash2, 
  Edit3, 
  Calendar, 
  Weight, 
  Plus, 
  Loader2
} from "lucide-react";

const SPECIES_OPTIONS = ["Dog", "Cat", "Bird", "Rabbit", "Fish", "Hamster", "Other"];

export default function MyPetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PetCreate & { photo_url?: string }>({ name: "", species: "Dog", photo_url: "" });
  const [submitting, setSubmitting] = useState(false);
  
  // Editing state
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Pet>>({});
  const [updating, setUpdating] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Pet name is required");
    setSubmitting(true);
    try {
      await createPet({
        name: form.name,
        species: form.species,
        breed: form.breed || undefined,
        dob: form.dob || undefined,
        weight: form.weight || undefined,
        photo_url: form.photo_url || undefined
      } as any);
      toast.success("Pet added!");
      setShowForm(false);
      setForm({ name: "", species: "Dog", photo_url: "" });
      fetchPets();
    } catch {
      toast.error("Failed to add pet");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (pet: Pet) => {
    setEditingPetId(pet.id);
    setEditForm({ ...pet });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name?.trim()) return toast.error("Pet name is required");
    if (!editingPetId) return;
    setUpdating(true);
    try {
      await updatePet(editingPetId, {
        name: editForm.name,
        species: editForm.species,
        breed: editForm.breed || "",
        dob: editForm.dob || "",
        weight: editForm.weight || undefined,
        photo_url: editForm.photo_url || ""
      });
      toast.success("Pet details updated!");
      setEditingPetId(null);
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
      fetchPets();
    } catch {
      toast.error("Failed to remove pet");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-serif text-ps-dark">My Pets</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-ps-dark text-white px-4 py-2 rounded-lg font-medium hover:bg-ps-darker flex items-center gap-1.5 transition text-sm shadow-sm"
        >
          <Plus size={16} /> Add Pet
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ps-dark mb-4 font-serif">Add a New Pet</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Pet Name *</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Buddy"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Species *</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ps-green outline-none bg-white"
                  value={form.species}
                  onChange={e => setForm({ ...form, species: e.target.value })}
                >
                  {SPECIES_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Breed</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                  value={form.breed || ""}
                  onChange={e => setForm({ ...form, breed: e.target.value })}
                  placeholder="e.g. Golden Retriever"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date of Birth</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                  value={form.dob || ""}
                  onChange={e => setForm({ ...form, dob: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                  value={form.weight || ""}
                  onChange={e => setForm({ ...form, weight: parseFloat(e.target.value) || undefined })}
                  placeholder="e.g. 12.5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Photo URL</label>
                <input
                  type="url"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                  value={form.photo_url || ""}
                  onChange={e => setForm({ ...form, photo_url: e.target.value })}
                  placeholder="e.g. https://images.unsplash.com/..."
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-ps-dark text-white px-5 py-2 rounded-lg font-medium hover:bg-ps-darker disabled:opacity-50 transition text-sm"
              >
                {submitting ? "Saving..." : "Save Pet"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border px-5 py-2 rounded-lg font-medium hover:bg-gray-50 transition text-sm text-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-12 flex flex-col items-center">
          <Loader2 className="animate-spin text-ps-green w-8 h-8 mb-3" />
          <p>Loading your pets...</p>
        </div>
      ) : pets.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-2xl border flex flex-col items-center justify-center">
          <div className="text-gray-300 mb-4 flex justify-center"><PawPrint size={48} /></div>
          <p className="font-semibold text-gray-700">No pets yet.</p>
          <p className="text-sm text-gray-400 mt-1">Add your first pet to complete your profile!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pets.map(pet => {
            const isEditing = pet.id === editingPetId;
            return (
              <div key={pet.id} className="bg-white border rounded-2xl p-5 shadow-sm">
                {isEditing ? (
                  /* Edit Form Mode */
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <h3 className="font-semibold text-ps-dark font-serif mb-2">Edit Pet Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Pet Name *</label>
                        <input
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                          value={editForm.name || ""}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Species *</label>
                        <select
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ps-green outline-none bg-white"
                          value={editForm.species || ""}
                          onChange={e => setEditForm({ ...editForm, species: e.target.value })}
                        >
                          {SPECIES_OPTIONS.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Breed</label>
                        <input
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                          value={editForm.breed || ""}
                          onChange={e => setEditForm({ ...editForm, breed: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                          value={editForm.dob || ""}
                          onChange={e => setEditForm({ ...editForm, dob: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                          value={editForm.weight || ""}
                          onChange={e => setEditForm({ ...editForm, weight: parseFloat(e.target.value) || undefined })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Photo URL</label>
                        <input
                          type="url"
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                          value={editForm.photo_url || ""}
                          onChange={e => setEditForm({ ...editForm, photo_url: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={updating}
                        className="bg-ps-dark text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-ps-darker disabled:opacity-50 transition"
                      >
                        {updating ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPetId(null)}
                        className="border px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition text-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Display Mode */
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {pet.photo_url ? (
                        <img
                          src={pet.photo_url}
                          alt={pet.name}
                          className="w-14 h-14 object-cover rounded-full border-2 border-ps-green-pale flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-ps-green-pale text-ps-green rounded-full flex items-center justify-center flex-shrink-0">
                          <PawPrint size={24} />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-900 text-lg flex items-center gap-2">
                          {pet.name}
                          <span className="text-xs font-semibold px-2 py-0.5 bg-ps-green-pale text-ps-green border border-ps-green/10 rounded-full">
                            {pet.species}
                          </span>
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          {pet.breed && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium text-gray-400">Breed:</span> {pet.breed}
                            </span>
                          )}
                          {pet.dob && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span>DOB: {new Date(pet.dob).toLocaleDateString()}</span>
                            </span>
                          )}
                          {pet.weight && (
                            <span className="flex items-center gap-1">
                              <Weight className="w-3.5 h-3.5 text-gray-400" />
                              <span>{pet.weight} kg</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleStartEdit(pet)}
                        className="text-xs text-ps-green hover:text-white hover:bg-ps-green border border-ps-green/30 px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1"
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(pet.id, pet.name)}
                        className="text-xs text-red-500 hover:text-white hover:bg-red-500 border border-red-200 px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
