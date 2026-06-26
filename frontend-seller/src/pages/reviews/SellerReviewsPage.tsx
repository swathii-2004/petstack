import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, MessageSquare, Calendar, User, ShoppingBag } from "lucide-react";
import { getSellerReviews } from "../../api/reviews";

export default function SellerReviewsPage() {
  const { data: reviews = [], isLoading, error } = useQuery({
    queryKey: ["seller-reviews"],
    queryFn: getSellerReviews,
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
            className={i < rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}
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
        <div className="h-32 bg-white rounded-2xl border border-sl-border" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-white rounded-2xl border border-sl-border" />
          <div className="h-40 bg-white rounded-2xl border border-sl-border" />
          <div className="h-40 bg-white rounded-2xl border border-sl-border" />
        </div>
        <div className="space-y-4">
          <div className="h-28 bg-white rounded-xl border border-sl-border" />
          <div className="h-28 bg-white rounded-xl border border-sl-border" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-red-100 text-center">
        <div className="p-4 bg-red-50 text-red-500 rounded-full mb-4">
          <Star size={36} className="text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-sl-text-dark mb-2">Failed to Load Reviews</h3>
        <p className="text-sl-text-mid max-w-md">
          There was an error fetching your reviews. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header Panel */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-sl-border">
        <h1 className="text-[26px] font-bold text-sl-text-dark mb-2 tracking-tight">
          Product Reviews & Feedback
        </h1>
        <p className="text-sl-text-mid text-sm">
          Track customer ratings, review distributions, and comments for your products.
        </p>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Average Score */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sl-border flex flex-col justify-between">
          <div>
            <h3 className="text-[13px] font-semibold text-sl-text-mid uppercase tracking-wider mb-4">
              Average Rating
            </h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-bold text-sl-text-dark leading-none">{avgRating}</span>
              <span className="text-sl-text-mid font-medium">/ 5.0</span>
            </div>
            {renderStars(Math.round(parseFloat(avgRating)), 20)}
          </div>
          <p className="text-xs text-sl-text-mid mt-4">
            Across all products with customer ratings.
          </p>
        </div>

        {/* Total Feedback count */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sl-border flex flex-col justify-between">
          <div>
            <h3 className="text-[13px] font-semibold text-sl-text-mid uppercase tracking-wider mb-4">
              Total Reviews
            </h3>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-sl-emerald/10 text-sl-emerald rounded-xl">
                <MessageSquare size={28} />
              </div>
              <span className="text-4xl font-bold text-sl-text-dark">{totalReviews}</span>
            </div>
          </div>
          <p className="text-xs text-sl-text-mid mt-4">
            Total number of customer review comments.
          </p>
        </div>

        {/* Rating breakdown chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sl-border space-y-2.5">
          <h3 className="text-[13px] font-semibold text-sl-text-mid uppercase tracking-wider mb-2">
            Rating Distribution
          </h3>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingCounts[stars - 1];
            const pct = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <div key={stars} className="flex items-center text-xs gap-3">
                <span className="w-12 text-sl-text-dark font-semibold flex items-center gap-1">
                  {stars} <Star size={12} className="fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sl-indigo rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sl-text-mid font-medium">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-sl-text-dark tracking-tight px-1">
          Review Comments ({totalReviews})
        </h2>

        {reviews.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-sl-border text-center shadow-sm">
            <div className="w-16 h-16 bg-sl-bg text-sl-indigo rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={28} />
            </div>
            <h3 className="text-lg font-bold text-sl-text-dark mb-1">No Reviews Yet</h3>
            <p className="text-sl-text-mid text-sm max-w-sm mx-auto">
              Reviews will show up here once customers purchase your products and submit their feedback.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white p-6 rounded-2xl border border-sl-border shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-4"
              >
                {/* Product Header */}
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 border overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-400">
                      {review.product_image ? (
                        <img src={review.product_image} alt={review.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag size={18} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-[14.5px] font-bold text-sl-text-dark line-clamp-1">
                        {review.product_name || "Unknown Product"}
                      </h4>
                      <p className="text-[11px] text-sl-text-mid">Product ID: {review.product_id}</p>
                    </div>
                  </div>
                  
                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-xs text-sl-text-mid bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 font-medium">
                    <Calendar size={13} />
                    <span>{formatDate(review.created_at)}</span>
                  </div>
                </div>

                {/* Review Details */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-100 text-xs font-semibold text-sl-text-dark">
                      <User size={12} className="text-sl-text-mid" />
                      <span>{review.user_name || "Customer"}</span>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  
                  <p className="text-sl-text-dark text-[14px] leading-relaxed">
                    {review.comment}
                  </p>

                  {/* Review photos */}
                  {review.image_urls && review.image_urls.length > 0 && (
                    <div className="flex gap-2 pt-2">
                      {review.image_urls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-16 h-16 rounded-lg overflow-hidden border block hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={url}
                            alt={`Review photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
