import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, MessageSquare, Calendar, User, Award, ShieldAlert } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { getVetReviews } from "../../api/reviews";

export default function VetReviewsPage() {
  const { user } = useAuthStore();
  const vetId = user?.id || "";

  const { data: reviews = [], isLoading, error } = useQuery({
    queryKey: ["vet-reviews", vetId],
    queryFn: () => getVetReviews(vetId),
    enabled: !!vetId,
  });

  // Calculate statistics
  const totalReviews = reviews.length;
  const avgRating = totalReviews
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : "0.0";

  const ratingCounts = [0, 0, 0, 0, 0]; // index 0 = 1 star, ..., index 4 = 5 stars
  reviews.forEach((r) => {
    const idx = Math.min(Math.max(r.rating - 1, 0), 4);
    ratingCounts[idx]++;
  });

  const renderStars = (rating: number, size = 16) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={size}
            className={i < rating ? "fill-vt-orange text-vt-orange" : "text-gray-200"}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
        <div className="h-32 bg-white rounded-2xl border border-indigo-50" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-white rounded-2xl border border-indigo-50" />
          <div className="h-40 bg-white rounded-2xl border border-indigo-50" />
          <div className="h-40 bg-white rounded-2xl border border-indigo-50" />
        </div>
        <div className="space-y-4">
          <div className="h-24 bg-white rounded-xl border border-indigo-50" />
          <div className="h-24 bg-white rounded-xl border border-indigo-50" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-red-100 text-center">
        <div className="p-4 bg-red-50 text-red-500 rounded-full mb-4">
          <ShieldAlert size={36} />
        </div>
        <h3 className="text-xl font-bold text-vt-text-dark mb-2">Failed to Load Reviews</h3>
        <p className="text-vt-text-mid max-w-md">
          There was an error fetching your reviews. Please check your internet connection or try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header Panel */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-vt-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-vt-text-dark mb-2">
            Reviews & Ratings
          </h1>
          <p className="text-vt-text-mid text-sm">
            Read direct feedback and ratings submitted by pet parents after their completed appointments.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-vt-bg-alt px-4 py-3 rounded-xl border border-vt-border">
          <div className="p-2 bg-vt-teal text-white rounded-lg">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[11px] text-vt-text-mid uppercase tracking-wider font-semibold">Vet Status</p>
            <p className="text-[13px] text-vt-text-dark font-bold capitalize">{user?.status || "Active"}</p>
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Average Score */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-vt-border flex flex-col justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-vt-text-mid mb-4">Average Rating</h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-bold text-vt-text-dark leading-none">{avgRating}</span>
              <span className="text-vt-text-mid font-medium">/ 5.0</span>
            </div>
            {renderStars(Math.round(parseFloat(avgRating)), 20)}
          </div>
          <p className="text-[12px] text-vt-text-mid mt-4">
            Calculated across all customer ratings.
          </p>
        </div>

        {/* Total Feedback count */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-vt-border flex flex-col justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-vt-text-mid mb-4">Total Reviews</h3>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-vt-mint-light text-vt-teal rounded-xl">
                <MessageSquare size={28} />
              </div>
              <span className="text-4xl font-bold text-vt-text-dark">{totalReviews}</span>
            </div>
          </div>
          <p className="text-[12px] text-vt-text-mid mt-4">
            Completed consultations with feedback.
          </p>
        </div>

        {/* Rating breakdown chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-vt-border space-y-2.5">
          <h3 className="text-[14px] font-semibold text-vt-text-mid mb-2">Rating Distribution</h3>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingCounts[stars - 1];
            const pct = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <div key={stars} className="flex items-center text-xs gap-3">
                <span className="w-12 text-vt-text-dark font-medium flex items-center gap-1">
                  {stars} <Star size={12} className="fill-vt-orange text-vt-orange" />
                </span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-vt-orange rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-vt-text-mid">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-vt-text-dark px-1">
          Detailed Comments ({totalReviews})
        </h2>

        {reviews.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-vt-border text-center shadow-sm">
            <div className="w-16 h-16 bg-vt-bg-alt text-vt-teal rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={28} />
            </div>
            <h3 className="text-lg font-bold text-vt-text-dark mb-1">No Reviews Yet</h3>
            <p className="text-vt-text-mid text-sm max-w-md mx-auto">
              Reviews will show up here once pet parents finish their appointments and share their feedback. Keep up the great service!
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white p-6 rounded-2xl border border-vt-border shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-start justify-between gap-4 group"
              >
                <div className="space-y-3 flex-1">
                  {/* Rating and Author */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      <User size={13} className="text-vt-text-mid" />
                      <span className="text-xs font-semibold text-vt-text-dark">
                        {review.user_name || "Pet Parent"}
                      </span>
                    </div>
                    {renderStars(review.rating)}
                  </div>

                  {/* Comment */}
                  <p className="text-vt-text-dark text-[14.5px] leading-relaxed">
                    {review.comment}
                  </p>
                </div>

                {/* Date */}
                <div className="flex items-center gap-1.5 text-xs text-vt-text-mid self-start md:self-auto bg-slate-50 md:bg-transparent px-2.5 py-1 md:p-0 rounded-lg md:rounded-none">
                  <Calendar size={13} />
                  <span>{formatDate(review.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
