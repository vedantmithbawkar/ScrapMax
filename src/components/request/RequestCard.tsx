'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PickupRequest, WASTE_CATEGORY_LABELS } from '@/types';
import { MapPin, MessageSquare, ChevronRight, CheckCircle2, Truck, Camera, X } from 'lucide-react';
import { useI18n } from '@/i18n/context';

interface RequestCardProps {
  request: PickupRequest;
  userRole: 'household' | 'collector';
  onStatusUpdate?: (requestId: string, newStatus: PickupRequest['status']) => void;
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

export default function RequestCard({ request, userRole, onStatusUpdate }: RequestCardProps) {
  const { t } = useI18n();
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null);

  // Derive primary category icon & name
  const primaryItem = request.waste_items?.[0];
  const primaryCatInfo = primaryItem ? WASTE_CATEGORY_LABELS[primaryItem.category] : null;

  // Estimated point or value representation
  const estimatedPoints = Math.round((request.total_estimated_weight_kg || 5) * 18);

  // Aggregate photos from pickup_requests table and waste_items table
  const allPhotos: string[] = [
    ...(request.photos || []),
    ...(request.waste_items?.flatMap((it) => it.photos || []) || []),
  ].filter((url, idx, self) => url && self.indexOf(url) === idx);

  const displayDate = formatPickupDate(request.scheduled_date);

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
                {primaryItem ? t('categoriesShort.' + primaryItem.category) : 'Recyclables'}
                {request.waste_items && request.waste_items.length > 1 && ` +${request.waste_items.length - 1} more`}
              </h3>
              <p className="text-[13px] font-medium text-[#6B7280] mt-0.5">
                {request.total_estimated_weight_kg || 5} kg · {displayDate}
              </p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-[18px] sm:text-[20px] font-extrabold text-[#136B3B] leading-tight block">
              {estimatedPoints}
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
              {t('status.' + request.status)}
            </span>
          </div>
        </div>

        {/* Address line */}
        <div className="flex items-center gap-1.5 text-xs text-[#526056] bg-[#F8FAF9] p-2.5 rounded-xl border border-gray-100">
          <MapPin className="w-3.5 h-3.5 text-[#136B3B] flex-shrink-0" />
          <span className="truncate">{request.address}</span>
        </div>

        {/* Waste Items Badges if multiple */}
        {request.waste_items && request.waste_items.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {request.waste_items.map((item, idx) => {
              const catInfo = WASTE_CATEGORY_LABELS[item.category];
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
            <Link
              href={`/chat/${request.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F4FAF6] hover:bg-[#E6F4EA] text-[#136B3B] text-xs font-bold transition border border-[#DDE3EA]"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </Link>

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

                {request.status === 'accepted' && (
                  <button
                    onClick={() => onStatusUpdate(request.id, 'in_progress')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#5E5C6B] hover:bg-[#464452] text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Start</span>
                  </button>
                )}

                {request.status === 'in_progress' && (
                  <button
                    onClick={() => onStatusUpdate(request.id, 'completed')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </article>

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
    </>
  );
}
