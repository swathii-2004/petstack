import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Search, FileText, CheckCircle2 } from "lucide-react";
import { createPrescription, Medicine, PrescriptionCreate } from "../../api/prescriptions";
import { getProducts, Product } from "../../api/products";

interface PrescriptionWriterProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  onSuccess: (prescriptionId: string) => void;
}

export default function PrescriptionWriter({ isOpen, onClose, appointmentId, onSuccess }: PrescriptionWriterProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([{ name: "", dosage: "", frequency: "", duration: "", notes: "" }]);
  const [generalNotes, setGeneralNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search products effect
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await getProducts(searchQuery);
        // filter out already selected ones
        const filtered = data.items.filter(item => !selectedProducts.find(p => p._id === item._id));
        setSearchResults(filtered);
      } catch (err) {
        console.error("Failed to search products", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedProducts]);

  if (!isOpen) return null;

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: "", dosage: "", frequency: "", duration: "", notes: "" }]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: keyof Medicine, value: string) => {
    const newMeds = [...medicines];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setMedicines(newMeds);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProducts([...selectedProducts, product]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p._id !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate
    const validMedicines = medicines.filter(m => m.name.trim() !== "");
    if (validMedicines.length === 0 && !generalNotes.trim()) {
      setError("Please add at least one medicine or general note.");
      return;
    }
    
    // Check if valid medicines have required fields
    for (const m of validMedicines) {
      if (!m.dosage || !m.frequency || !m.duration) {
        setError("Please fill out all required fields for each medicine (Name, Dosage, Frequency, Duration).");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: PrescriptionCreate = {
        appointment_id: appointmentId,
        medicines: validMedicines,
        general_notes: generalNotes || undefined,
        recommended_product_ids: selectedProducts.map(p => p._id)
      };
      
      const res = await createPrescription(payload);
      onSuccess(res._id);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create prescription");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="p-6 border-b flex justify-between items-center bg-indigo-50">
          <div className="flex items-center gap-2 text-indigo-800">
            <FileText className="w-5 h-5" />
            <h2 className="text-xl font-bold">Write Prescription</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-indigo-100 rounded-full text-indigo-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <form id="prescription-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Medicines Section */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-lg font-bold text-gray-800">Medicines</h3>
              </div>
              
              <div className="space-y-4">
                {medicines.map((med, index) => (
                  <div key={index} className="p-4 border rounded-xl bg-gray-50 relative">
                    {medicines.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => handleRemoveMedicine(index)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Medicine Name *</label>
                        <input
                          type="text"
                          required
                          value={med.name}
                          onChange={(e) => handleMedicineChange(index, "name", e.target.value)}
                          placeholder="e.g. Amoxicillin"
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Dosage *</label>
                        <input
                          type="text"
                          required
                          value={med.dosage}
                          onChange={(e) => handleMedicineChange(index, "dosage", e.target.value)}
                          placeholder="e.g. 250mg or 1 tablet"
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Frequency *</label>
                        <input
                          type="text"
                          required
                          value={med.frequency}
                          onChange={(e) => handleMedicineChange(index, "frequency", e.target.value)}
                          placeholder="e.g. Twice a day"
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Duration *</label>
                        <input
                          type="text"
                          required
                          value={med.duration}
                          onChange={(e) => handleMedicineChange(index, "duration", e.target.value)}
                          placeholder="e.g. 5 days"
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Special Instructions</label>
                      <input
                        type="text"
                        value={med.notes || ""}
                        onChange={(e) => handleMedicineChange(index, "notes", e.target.value)}
                        placeholder="e.g. Take after meals"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button 
                type="button" 
                onClick={handleAddMedicine}
                className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="w-4 h-4" /> Add Another Medicine
              </button>
            </div>

            <hr />

            {/* General Notes */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">General Notes</h3>
              <textarea
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Any diet restrictions, activity limits, or general advice..."
                className="w-full border rounded-xl p-3 text-sm min-h-[100px] focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <hr />

            {/* Product Recommendations */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Recommend Products (Optional)</h3>
              <p className="text-sm text-gray-500 mb-4">Search and attach products available on PetStack.</p>
              
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                
                {searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg border rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map(product => (
                      <button
                        key={product._id}
                        type="button"
                        onClick={() => handleSelectProduct(product)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {product.image_urls?.[0] && (
                            <img src={product.image_urls[0]} alt="" className="w-8 h-8 rounded object-cover" />
                          )}
                          <span>{product.name}</span>
                        </div>
                        <span className="text-indigo-600 font-medium">${product.price}</span>
                      </button>
                    ))}
                  </div>
                )}
                {isSearching && <div className="absolute right-3 top-2.5 text-xs text-gray-400">Searching...</div>}
              </div>

              {selectedProducts.length > 0 && (
                <div className="space-y-2">
                  {selectedProducts.map(product => (
                    <div key={product._id} className="flex items-center justify-between p-2 border rounded-lg bg-white">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">{product.name}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveProduct(product._id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </form>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="prescription-form"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? "Generating PDF..." : "Generate & Save Prescription"}
          </button>
        </div>

      </div>
    </div>
  );
}
