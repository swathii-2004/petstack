import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getVets, Vet, getVetReviews, createVetReview, VetReview, checkVetReviewEligibility } from "../../api/vets";
import { toast } from "sonner";
import { 
  Search, 
  Stethoscope, 
  CalendarPlus, 
  Building2, 
  Clock, 
  Star, 
  MessageSquare, 
  X, 
  Loader2,
  Info
} from "lucide-react";

export default function VetDiscoveryPage() {
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Reviews Modal state
  const [selectedVet, setSelectedVet] = useState<Vet | null>(null);
  const [reviews, setReviews] = useState<VetReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [canReview, setCanReview] = useState(false);

  const fetchVets = async () => {
    try {
      const data = await getVets();
      setVets(data);
    } catch {
      toast.error("Failed to load vets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVets();
  }, []);

  const loadReviews = async (vetId: string) => {
    setReviewsLoading(true);
    try {
      const data = await getVetReviews(vetId);
      setReviews(data);
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setReviewsLoading(false);
    }
  };

  const checkEligibility = async (vetId: string) => {
    try {
      const res = await checkVetReviewEligibility(vetId);
      setCanReview(res.eligible);
    } catch {
      setCanReview(false);
    }
  };

  const handleOpenReviews = (vet: Vet) => {
    setSelectedVet(vet);
    setNewRating(5);
    setNewComment("");
    setCanReview(false);
    loadReviews(vet._id);
    checkEligibility(vet._id);
  };

  const handleCloseReviews = () => {
    setSelectedVet(null);
    setReviews([]);
  };

  const handleSendReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVet) return;
    if (!newComment.trim()) return toast.error("Please write a comment");
    setSubmittingReview(true);
    try {
      await createVetReview(selectedVet._id, newRating, newComment);
      toast.success("Review submitted successfully!");
      setNewComment("");
      setNewRating(5);
      loadReviews(selectedVet._id);
      fetchVets(); // refresh vet list to show updated average rating & review count
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const filtered = vets.filter(v =>
    v.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (v.specialisation || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 font-sans space-y-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-44 bg-white animate-pulse rounded-2xl border border-ps-cream-2" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-ps-cream-2 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-ps-cream rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Stethoscope size={28} className="text-ps-text-mid" />
          </div>
          <p className="font-semibold text-ps-text-dark text-lg">No vets found</p>
          <p className="text-ps-text-mid text-sm mt-1">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(vet => (
            <div key={vet._id}
              className="bg-white border border-ps-cream-2 rounded-2xl p-5 flex flex-col justify-between hover:border-ps-green hover:shadow-md transition-all duration-200">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-ps-green-pale rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Stethoscope size={20} className="text-ps-green" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-ps-text-dark text-base">{vet.full_name}</p>
                    
                    {/* Stars and Ratings count */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            size={12} 
                            className={i < Math.round(vet.rating || 0) ? "fill-amber-500 text-amber-500" : "text-gray-200"} 
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-gray-700">{vet.rating?.toFixed(1) || "0.0"}</span>
                      <span className="text-[10px] text-gray-400">({vet.review_count || 0})</span>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-3 text-xs text-ps-text-mid">
                      {vet.specialisation && (
                        <span className="flex items-center gap-1.5">
                          <Stethoscope size={13} className="text-gray-400" /> {vet.specialisation}
                        </span>
                      )}
                      {vet.clinic_name && (
                        <span className="flex items-center gap-1.5">
                          <Building2 size={13} className="text-gray-400" /> {vet.clinic_name}
                        </span>
                      )}
                      {vet.experience_years && (
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} className="text-gray-400" /> {vet.experience_years} years experience
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                <button
                  onClick={() => handleOpenReviews(vet)}
                  className="flex items-center gap-1.5 text-xs text-ps-green hover:underline font-semibold"
                >
                  <MessageSquare size={14} /> Reviews ({vet.review_count || 0})
                </button>
                <button
                  onClick={() => navigate(`/vets/${vet._id}/book`)}
                  className="flex items-center gap-1.5 bg-ps-dark text-white px-4 py-2 rounded-xl font-semibold text-xs hover:bg-ps-darker transition-colors shadow-sm"
                >
                  <CalendarPlus size={14} /> Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reviews Modal */}
      {selectedVet && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900 text-lg font-serif">Reviews & Ratings</h3>
                <p className="text-xs text-gray-500">Dr. {selectedVet.full_name}</p>
              </div>
              <button 
                onClick={handleCloseReviews}
                className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Submission Form */}
              {canReview ? (
                <div className="bg-ps-green-pale/30 border border-ps-green/10 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-800 text-sm mb-3">Give a Review</h4>
                  <form onSubmit={handleSendReview} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-600">Your Rating:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            className="p-0.5 text-amber-500 hover:scale-110 transition"
                          >
                            <Star 
                              size={18} 
                              className={star <= newRating ? "fill-amber-500 text-amber-500" : "text-gray-300"} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <textarea
                      rows={3}
                      placeholder="Describe your experience with this vet..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-ps-green outline-none resize-none bg-white"
                    />

                    <button
                      type="submit"
                      disabled={submittingReview || !newComment.trim()}
                      className="bg-ps-dark text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-ps-darker disabled:opacity-50 transition-all shadow-sm flex items-center gap-1.5"
                    >
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Only patients with a completed appointment with this vet can submit a review.</span>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Past Patient Reviews</h4>
                {reviewsLoading ? (
                  <div className="text-center py-6 text-gray-400 text-sm flex flex-col items-center">
                    <Loader2 className="animate-spin text-ps-green w-6 h-6 mb-2" />
                    Loading reviews...
                  </div>
                ) : reviews.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">No reviews yet. Be the first to share your experience!</p>
                ) : (
                  <div className="divide-y divide-gray-100 space-y-4">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-gray-900 text-sm">{rev.user_name || "Pet Parent"}</span>
                            <span className="text-[10px] text-gray-400 ml-2">
                              {new Date(rev.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                size={11} 
                                className={i < rev.rating ? "fill-amber-500 text-amber-500" : "text-gray-200"} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                          {rev.comment}
                        </p>
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
