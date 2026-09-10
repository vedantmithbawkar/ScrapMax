'use client';

import React, { useState } from 'react';
import { X, Star, CheckCircle2, Loader2, Sparkles, ThumbsUp, AlertCircle } from 'lucide-react';

interface RatingModalProps {
  requestId: string;
  reviewerId?: string;
  reviewerType?: 'customer' | 'kabadiwala';
  revieweeId?: string;
  collectorName?: string;
  onClose: () => void;
  onRatingSubmitted?: (rating: number) => void;
}

const RATING_DESCRIPTIONS: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: 'Poor', emoji: '😞', color: 'text-red-500' },
  2: { label: 'Fair', emoji: '😐', color: 'text-orange-500' },
  3: { label: 'Good', emoji: '🙂', color: 'text-amber-500' },
  4: { label: 'Very Good', emoji: '😊', color: 'text-lime-600' },
  5: { label: 'Excellent!', emoji: '🌟', color: 'text-[#136B3B]' },
};

const QUICK_COMPLIMENTS = [
  '⏱️ Punctual Arrival',
  '⚖️ Accurate Digital Scale',
  '💰 Fair Scrap Pricing',
  '🤝 Polite & Professional',
  '⚡ Instant Settlement',
  '🌿 Clean & Tidy',
];

export default function RatingModal({
  requestId,
  reviewerId = 'user-h101',
  reviewerType = 'customer',
  revieweeId = 'collector-c201',
  collectorName = 'Kabadiwala Partner',
  onClose,
  onRatingSubmitted,
}: RatingModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [alreadyRated, setAlreadyRated] = useState<{ rating: number; comment?: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(`scrapmax_rating_${requestId}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const activeRating = hoverRating !== null ? hoverRating : rating;
  const ratingInfo = RATING_DESCRIPTIONS[activeRating] || RATING_DESCRIPTIONS[5];

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const fullComment = [
      selectedChips.length > 0 ? selectedChips.join(' · ') : null,
      comment.trim() ? comment.trim() : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    const payload = {
      transaction_id: requestId,
      reviewer_id: reviewerId,
      reviewer_type: reviewerType,
      reviewee_id: revieweeId,
      rating,
      review_comment: fullComment || null,
    };

    try {
      const res = await fetch('/api/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.detail && data.detail.includes('already submitted')) {
          setAlreadyRated({ rating, comment: fullComment || undefined });
          localStorage.setItem(
            `scrapmax_rating_${requestId}`,
            JSON.stringify({ rating, comment: fullComment || undefined })
          );
        }
        setErrorMsg(data.detail || data.error || 'Failed to submit rating.');
        setIsSubmitting(false);
        return;
      }

      // Save locally
      localStorage.setItem(
        `scrapmax_rating_${requestId}`,
        JSON.stringify({ rating, comment: fullComment || undefined })
      );

      if (onRatingSubmitted) {
        onRatingSubmitted(rating);
      }

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rate your experience"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in" />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 z-10"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90dvh', overflowY: 'auto' }}
      >
        {/* Header Strip */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between bg-[#F8FAF9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-2xs">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#191C1E] leading-tight">
                Rate Experience
              </h2>
              <p className="text-[11px] text-[#526056] truncate max-w-[220px]">
                {collectorName} · #{requestId.slice(0, 8)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success View */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#E6F4EA] border border-[#A6D5B8] flex items-center justify-center mx-auto text-[#136B3B] animate-bounce">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-extrabold text-[#191C1E]">Thank You!</h3>
            <p className="text-xs text-[#526056] leading-relaxed max-w-xs mx-auto">
              Your {rating}★ rating has been recorded! Feedback ensures transparency and helps verify quality partners.
            </p>
          </div>
        ) : alreadyRated ? (
          /* Already Rated View */
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-500">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#191C1E]">Already Rated!</h3>
              <p className="text-xs text-[#526056] mt-1">
                You rated this pickup <span className="font-bold text-[#136B3B]">{alreadyRated.rating} ★</span>.
              </p>
              {alreadyRated.comment && (
                <div className="mt-3 p-3 bg-[#F8FAF9] border border-gray-100 rounded-xl text-left text-xs text-[#191C1E] italic">
                  &quot;{alreadyRated.comment}&quot;
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#136B3B] text-white text-xs font-bold shadow-sm hover:bg-[#0F5730] transition"
            >
              Close
            </button>
          </div>
        ) : (
          /* Rating Form View */
          <div className="p-5 space-y-5">
            {/* Star Rating Section */}
            <div className="text-center py-2 bg-radial from-amber-50/50 to-transparent rounded-2xl">
              <p className="text-xs font-medium text-[#526056] mb-2">
                How was the scrap collection &amp; weighing?
              </p>

              {/* Stars Row */}
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = starVal <= activeRating;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(null)}
                      aria-label={`${starVal} star`}
                      className="p-1.5 transition-transform hover:scale-115 active:scale-95 focus:outline-none"
                    >
                      <Star
                        className={`w-9 h-9 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                            : 'text-gray-200 fill-gray-50'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Rating Label & Emoji */}
              <div className="mt-2 text-sm font-extrabold flex items-center justify-center gap-1.5">
                <span className="text-base">{ratingInfo.emoji}</span>
                <span className={ratingInfo.color}>{ratingInfo.label}</span>
                <span className="text-xs font-bold text-gray-400">({activeRating}.0 / 5.0)</span>
              </div>
            </div>

            {/* Quick Compliments Chips */}
            <div className="space-y-2">
              <label className="text-[11.5px] font-bold text-[#191C1E] flex items-center gap-1">
                <ThumbsUp className="w-3 h-3 text-[#136B3B]" />
                What went well? (Optional)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_COMPLIMENTS.map((chip) => {
                  const isSelected = selectedChips.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleChip(chip)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition active:scale-95 ${
                        isSelected
                          ? 'bg-[#E6F4EA] text-[#136B3B] border border-[#A6D5B8] shadow-2xs font-bold'
                          : 'bg-[#F8FAF9] text-[#526056] border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Review Comment Textarea */}
            <div className="space-y-1.5">
              <label htmlFor="rating-comment" className="text-[11.5px] font-bold text-[#191C1E]">
                Write a note (Optional)
              </label>
              <textarea
                id="rating-comment"
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share details about punctuality, pricing, digital scale..."
                className="w-full px-3 py-2 text-xs bg-[#F8FAF9] border border-gray-200 rounded-xl placeholder:text-gray-400 text-[#191C1E] focus:outline-none focus:border-[#136B3B] focus:bg-white transition"
              />
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Actions */}
            <div className="pt-1 flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-bold text-[#526056] hover:bg-gray-50 transition"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-2 py-2.5 px-4 rounded-xl bg-[#136B3B] hover:bg-[#0F5730] disabled:opacity-50 text-white text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-sm shadow-[#136B3B]/20 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                    <span>Submit {rating}★ Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
