import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PickupRequest, PaymentDetails, STATUS_LABELS, WASTE_CATEGORY_LABELS } from '@/types';
import { MapPin, MessageSquare, ChevronRight, Truck, Camera, X, Receipt, Flag, Star, Navigation } from 'lucide-react';
import HandoverModal from './HandoverModal';
import ReceiptModal from './ReceiptModal';
import ReportModal from './ReportModal';
import RatingModal from './RatingModal';

interface RequestCardProps {
  request: PickupRequest;
  userRole: 'household' | 'collector';
  onStatusUpdate?: (requestId: string, newStatus: PickupRequest['status']) => void;
  onCompletePayment?: (requestId: string, payment: PaymentDetails) => Promise<void> | void;
}

function formatPickupDate(dateStr: string) {
  if (!dateStr) return 'Scheduled';
  if (dateStr.includes('·') || dateStr.includes('Today') || dateStr.includes('Tomorrow')) {
    return dateStr;
  }
  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    if (dateStr === today) return 'Today';
    if (dateStr === tomorrow) return 'Tomorrow';

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export default function RequestCard({
  request,
  userRole,
  onStatusUpdate,
  onCompletePayment,
}: RequestCardProps) {
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null);
  const [showHandoverModal, setShowHandoverModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const roleRatingKey = `scrapmax_rating_${request.id}_${userRole === 'collector' ? 'collector' : 'customer'}`;
  const [userRating, setUserRating] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored =
        localStorage.getItem(roleRatingKey) ||
        (userRole === 'household' ? localStorage.getItem(`scrapmax_rating_${request.id}`) : null);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.rating ?? null;
      }
    } catch {
      return null;
    }
    return null;
  });

  const statusInfo = STATUS_LABELS[request.status];

  // Derive primary category icon & name
  const primaryItem = request.waste_items?.[0];
  const primaryCatInfo = primaryItem ? WASTE_CATEGORY_LABELS[primaryItem.category] : null;

  // Estimated point or value representation
  const estimatedPoints = Math.round((request.total_estimated_weight_kg || 5) * 18);

  // Aggregate photos from pickup_requests table and waste_items table
  const allPhotos: string[] = [
    ...(request.photos || []),
    ...(request.waste_items?.flatMap((w) => w.photos || []) || []),
  ].filter((url, idx, self) => url && self.indexOf(url) === idx);

  return (
    <>
      <article
        data-purpose="activity-card"
        className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 hover:border-gray-200 transition-all space-y-3.5"
      >
        {/* Top row: Leading icon badge + Title & weight + Trailing points & status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#EBF5EE] flex items-center justify-center text-[#136B3B] flex-shrink-0 text-xl select-none">
              {primaryCatInfo ? primaryCatInfo.icon : '♻️'}
            </div>
            <div>
              <h3 className="text-[16px] sm:text-[17px] font-bold text-[#191C1E] leading-tight">
                {primaryCatInfo ? primaryCatInfo.label.split('&')[0].trim() : 'Recyclables'}
                {request.waste_items && request.waste_items.length > 1 && ` +${request.waste_items.length - 1} more`}
              </h3>
              <p className="text-[13px] font-medium text-[#6B7280] mt-0.5">
                {request.total_estimated_weight_kg || 5} kg · {formatPickupDate(request.scheduled_date)}
              </p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-[18px] sm:text-[20px] font-extrabold text-[#136B3B] leading-tight block">
              {request.payment ? `₹${request.payment.totalAmount}` : estimatedPoints}
            </span>
            <span
              className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                request.status === 'completed'
                  ? 'bg-[#E6F4EA] text-[#136B3B]'
                  : request.status === 'in_progress'
                  ? 'bg-[#EAE6F8] text-[#4A3E8F]'
                  : request.status === 'accepted'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Address line */}
        <div className="flex items-center gap-1.5 text-xs text-[#526056] bg-[#F8FAF9] p-2.5 rounded-xl border border-gray-100">
          <MapPin className="w-3.5 h-3.5 text-[#136B3B] flex-shrink-0" />
          <span className="truncate">{request.address}</span>
        </div>

        {/* Payment Received Banner for Household */}
        {userRole === 'household' && request.status === 'completed' && request.payment && (
          <div className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-[#EDF7F2] to-[#E6F4EA] border border-[#A6D5B8] rounded-2xl">
            <span className="text-xl flex-shrink-0">💰</span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[#136B3B]">
                ₹{request.payment.totalAmount} Received!
              </p>
              <p className="text-[10px] text-[#2B6B47] leading-snug">
                {request.payment.method === 'upi'
                  ? 'Money credited to your bank account via UPI.'
                  : 'Cash received at doorstep.'}
              </p>
            </div>
            <span className="text-[10px] font-bold text-[#136B3B] bg-white px-2 py-0.5 rounded-full border border-[#A6D5B8] flex-shrink-0">
              ✓ Paid
            </span>
          </div>
        )}

        {userRole === 'household' && request.status !== 'pending' && (
          <div className="flex items-center justify-between p-2 sm:p-2.5 bg-[#E6F4EA]/70 border border-[#A6D5B8] rounded-xl text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">🚛</span>
              <div className="min-w-0">
                <span className="font-bold text-[#191C1E] truncate block">
                  {request.collector?.full_name || 'Ramesh Kumar (Verified Kabadiwala)'}
                </span>
                <span className="text-[11px] text-[#136B3B] font-mono font-bold block truncate">
                  {request.collector?.phone || '+91 98201 45892'}
                </span>
              </div>
            </div>
            <a
              href={`tel:${(request.collector?.phone || '+919820145892').replace(/\s+/g, '')}`}
              className="px-3 py-1 bg-[#136B3B] hover:bg-[#0F5730] text-white text-[11px] font-bold rounded-lg transition shadow-2xs shrink-0"
            >
              Call
            </a>
          </div>
        )}

        {/* Household Contact and Address strip for Collector */}
        {userRole === 'collector' && request.status !== 'pending' && (
          <div className="flex items-center justify-between p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">🏠</span>
              <div className="min-w-0">
                <span className="font-bold text-[#191C1E] truncate block">
                  {request.household?.full_name || 'Aarav Sharma (Customer)'}
                </span>
                <span className="text-[11px] text-blue-700 font-mono font-bold block truncate">
                  {request.household?.phone || '+91 98201 54321'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={`tel:${(request.household?.phone || '+919820154321').replace(/\s+/g, '')}`}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition shadow-2xs"
              >
                Call
              </a>
              <a
                href={`https://wa.me/${(request.household?.phone || '+919820154321').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${request.household?.full_name || 'there'}, I am your ScrapMax collector for pickup #${request.id.slice(0, 8)}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition shadow-2xs"
              >
                WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Waste Items Badges if multiple */}
        {request.waste_items && request.waste_items.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {request.waste_items.map((item, idx) => {
              const catInfo = WASTE_CATEGORY_LABELS[item.category] || {
                label: item.category,
                icon: '📦',
              };
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-[11px] font-semibold text-[#191C1E]"
                >
                  <span>{catInfo.icon}</span>
                  <span>{item.approx_weight_kg}kg</span>
                </span>
              );
            })}
          </div>
        )}

        {/* Attached Photos Gallery Strip */}
        {allPhotos.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#136B3B]">
              <Camera className="w-3.5 h-3.5" />
              <span>
                {allPhotos.length} Scrap Photo{allPhotos.length > 1 ? 's' : ''} Attached
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
              {allPhotos.map((imgUrl, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => setSelectedPhotoModal(imgUrl)}
                  className="relative w-14 h-14 rounded-xl border border-emerald-200 overflow-hidden flex-shrink-0 hover:opacity-90 active:scale-95 transition shadow-2xs group"
                >
                  <Image
                    src={imgUrl}
                    alt={`Scrap photo ${pIdx + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes if any */}
        {request.notes && (
          <p className="text-xs text-[#6B7280] italic px-1">
            &quot;{request.notes}&quot;
          </p>
        )}

        {/* Sub-divider line */}
        <hr className="border-t border-gray-100" />

        {/* Footer metadata & Action buttons */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <p className="text-[11.5px] font-medium text-[#6B7280]">
            Req #{request.id.slice(0, 8)}
          </p>

          <div className="flex items-center gap-2">
            {userRole === 'household' ? (
              <Link
                href={`/household/track/${request.id}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F4FAF6] hover:bg-[#E6F4EA] text-[#136B3B] text-xs font-bold transition border border-[#DDE3EA]"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </Link>
            ) : (
              <Link
                href={`/collector/chat/${request.id}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F4FAF6] hover:bg-[#E6F4EA] text-[#136B3B] text-xs font-bold transition border border-[#DDE3EA]"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </Link>
            )}

            {/* Receipt Button for Completed Pickups */}
            {request.status === 'completed' && (
              <button
                type="button"
                onClick={() => setShowReceiptModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E6F4EA] hover:bg-[#D4EBD9] text-[#136B3B] text-xs font-bold transition border border-[#A6D5B8] shadow-xs"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Receipt</span>
              </button>
            )}

            {/* Rate Experience Button for Completed Pickups — Bi-directional for both household and collector */}
            {request.status === 'completed' && (
              <button
                type="button"
                id={`rate-btn-${request.id}-${userRole}`}
                onClick={() => setShowRatingModal(true)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition border shadow-xs ${
                  userRating
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${userRating ? 'fill-amber-400 text-amber-500' : 'text-amber-500'}`} />
                <span>
                  {userRating
                    ? `${userRating}★ Rated`
                    : userRole === 'collector'
                    ? 'Rate Citizen'
                    : 'Rate Collector'}
                </span>
              </button>
            )}

            {/* Report Problem Button — household only */}
            {userRole === 'household' && (
              <button
                type="button"
                id={`report-btn-${request.id}`}
                onClick={() => setShowReportModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold transition border border-red-100"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report</span>
              </button>
            )}

            {/* Collector Lifecycle Actions */}
            {userRole === 'collector' && onStatusUpdate && (
              <>
                {request.status === 'pending' && (
                  <button
                    onClick={() => onStatusUpdate(request.id, 'accepted')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    <span>Accept</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {(request.status === 'accepted' || request.status === 'in_progress') && (
                  <Link
                    href={`/collector/map?requestId=${request.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>View Route</span>
                  </Link>
                )}

                {request.status === 'accepted' && (
                  <button
                    onClick={() => onStatusUpdate(request.id, 'in_progress')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#5E5C6B] hover:bg-[#464452] text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Start</span>
                  </button>
                )}

                {/* Finalize Deal (Deal Done) Action Button for Collector */}
                {(request.status === 'accepted' || request.status === 'in_progress') && (
                  <button
                    type="button"
                    onClick={() => setShowHandoverModal(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#136B3B] to-emerald-700 hover:from-[#0F5730] hover:to-emerald-800 text-white text-xs font-extrabold rounded-xl shadow-sm transition animate-pulse touch-feedback"
                  >
                    <span>🤝</span>
                    <span>Finalize Deal</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </article>

      {/* Handover & Doorstep Payment Modal */}
      {showHandoverModal && (
        <HandoverModal
          request={request}
          onClose={() => setShowHandoverModal(false)}
          onCompletePayment={async (reqId, payment) => {
            if (onCompletePayment) {
              await onCompletePayment(reqId, payment);
            } else if (onStatusUpdate) {
              onStatusUpdate(reqId, 'completed');
            }
            setShowHandoverModal(false);
          }}
        />
      )}

      {/* Digital Recycling Receipt Modal */}
      {showReceiptModal && (
        <ReceiptModal
          request={request}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* Report / Problem Modal */}
      {showReportModal && (
        <ReportModal
          requestId={request.id}
          requestAddress={request.address}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Full-Screen Photo Inspection Lightbox Modal */}
      {selectedPhotoModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedPhotoModal(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
              <span className="text-xs font-bold text-[#191C1E] flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#136B3B]" />
                Scrap Photo Preview
              </span>
              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                aria-label="Close photo preview"
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden mt-2 bg-black/5">
              <Image
                src={selectedPhotoModal}
                alt="Enlarged scrap inspection preview"
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Rating & Review Modal — Bi-directional */}
      {showRatingModal && (
        <RatingModal
          requestId={request.id}
          reviewerType={userRole === 'collector' ? 'collector' : 'customer'}
          reviewerId={userRole === 'collector' ? (request.collector_id || 'collector-c201') : (request.household_id || 'user-h101')}
          revieweeId={userRole === 'collector' ? (request.household_id || 'user-h101') : (request.collector_id || 'collector-c201')}
          revieweeName={
            userRole === 'collector'
              ? request.household?.full_name || 'Citizen Customer'
              : request.collector?.full_name || 'Kabadiwala Partner'
          }
          onClose={() => setShowRatingModal(false)}
          onRatingSubmitted={(r) => setUserRating(r)}
        />
      )}
    </>
  );
}
