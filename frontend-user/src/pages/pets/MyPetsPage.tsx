import React, { useEffect, useState } from "react";
import { getMyPets, createPet, deletePet, Pet, PetCreate } from "../../api/pets";
import { toast } from "sonner";

const SPECIES_OPTIONS = ["Dog", "Cat", "Bird", "Rabbit", "Fish", "Hamster", "Other"];

export default function MyPetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PetCreate>({ name: "", species: "Dog" });
  const [submitting, setSubmitting] = useState(false);

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
      await createPet(form);
      toast.success("Pet added!");
      setShowForm(false);
      setForm({ name: "", species: "Dog" });
      fetchPets();
    } catch {
      toast.error("Failed to add pet");
    } finally {
      setSubmitting(false);
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
        <h1 className="text-2xl font-bold">My Pets</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-ps-dark text-white px-4 py-2 rounded-lg font-medium hover:bg-ps-darker"
        >
          + Add Pet
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Add a New Pet</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pet Name *</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ps-green outline-none"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Buddy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Species *</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ps-green outline-none"
                  value={form.species}
                  onChange={e => setForm({ ...form, species: e.target.value })}
                >
                  {SPECIES_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Breed</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ps-green outline-none"
                  value={form.breed || ""}
                  onChange={e => setForm({ ...form, breed: e.target.value })}
                  placeholder="e.g. Labrador"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ps-green outline-none"
                  value={form.dob || ""}
                  onChange={e => setForm({ ...form, dob: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ps-green outline-none"
                  value={form.weight || ""}
                  onChange={e => setForm({ ...form, weight: parseFloat(e.target.value) })}
                  placeholder="e.g. 12.5"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-ps-dark text-white px-5 py-2 rounded-lg font-medium hover:bg-ps-darker disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Pet"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border px-5 py-2 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading your pets...</div>
      ) : pets.length === 0 ? (
        <div className="text-center text-gray-500 py-12 bg-white rounded-lg border">
          <p className="text-4xl mb-3">🐾</p>
          <p className="font-medium">No pets yet. Add your first pet!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pets.map(pet => (
            <div key={pet.id} className="bg-white border rounded-lg p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-ps-green-pale rounded-full flex items-center justify-center text-2xl">
                  {pet.species === "Dog" ? "🐶" : pet.species === "Cat" ? "🐱" : pet.species === "Bird" ? "🐦" : "🐾"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{pet.name}</p>
                  <p className="text-sm text-gray-500">
                    {pet.species}{pet.breed ? ` · ${pet.breed}` : ""}{pet.weight ? ` · ${pet.weight}kg` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(pet.id, pet.name)}
                className="text-sm text-red-500 hover:text-red-700 font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
