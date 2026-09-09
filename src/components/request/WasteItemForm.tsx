'use client';

import React, { useState } from 'react';
import { WasteCategory, WasteItem, WASTE_CATEGORY_LABELS } from '@/types';
import { Plus, Trash2, Package } from 'lucide-react';
import { useI18n } from '@/i18n/context';

interface WasteItemFormProps {
  items: WasteItem[];
  onChange: (items: WasteItem[]) => void;
}

export default function WasteItemForm({ items, onChange }: WasteItemFormProps) {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<WasteCategory>('PAPER');
  const [weight, setWeight] = useState<string>('5');
  const [notes, setNotes] = useState<string>('');

  const handleAddItem = () => {
    const numericWeight = parseFloat(weight);
    if (isNaN(numericWeight) || numericWeight <= 0) {
      alert('Please enter a valid weight in kg');
      return;
    }

    const newItem: WasteItem = {
      category: selectedCategory,
      approx_weight_kg: numericWeight,
      notes: notes.trim() || undefined,
      photos: [],
    };

    onChange([...items, newItem]);
    setNotes('');
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    onChange(updated);
  };

  const totalEstWeight = items.reduce((acc, curr) => acc + curr.approx_weight_kg, 0);

  return (
    <div className="space-y-5">
      {/* Category Pills / Chips Selection */}
      <div>
        <label className="block text-sm font-bold text-[#191C1E] mb-2.5">
          What do you want to recycle?
        </label>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {(Object.keys(WASTE_CATEGORY_LABELS) as WasteCategory[]).map((cat) => {
            const info = WASTE_CATEGORY_LABELS[cat];
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex-shrink-0 flex items-center gap-2 transition ${
                  isSelected
                    ? 'bg-[#EAE6F8] text-[#191C1E] border border-[#D6CDF0] shadow-xs'
                    : 'bg-white text-[#526056] border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="text-base select-none">{info.icon}</span>
                <span>{t('categoriesShort.' + cat)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Item Input details */}
      <div className="p-4 bg-[#F8FAF9] border border-gray-200 rounded-2xl space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Estimated weight with trailing kg unit */}
          <div>
            <label className="block text-xs font-bold text-[#191C1E] mb-1.5">
              Estimated quantity
            </label>
            <div className="relative flex items-center border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white focus-within:border-[#136B3B] transition">
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter quantity in kg"
                className="w-full text-sm text-[#191C1E] placeholder-gray-400 bg-transparent border-none p-0 focus:outline-none"
              />
              <span className="text-xs text-[#6B7280] font-semibold ml-2 select-none">kg</span>
            </div>
          </div>

          {/* Item Notes */}
          <div>
            <label className="block text-xs font-bold text-[#191C1E] mb-1.5">
              Item description / note
            </label>
            <div className="flex items-center border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white focus-within:border-[#136B3B] transition">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Bundled newspapers, clean bottles"
                className="w-full text-sm text-[#191C1E] placeholder-gray-400 bg-transparent border-none p-0 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddItem}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#E6F4EA] hover:bg-[#D4EBD9] text-[#136B3B] font-bold text-xs rounded-xl transition border border-[#A6D5B8]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Material to Pickup</span>
        </button>
      </div>

      {/* Item List Summary */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-bold text-[#191C1E] flex items-center gap-1.5">
            <Package className="w-4 h-4 text-[#136B3B]" />
            <span>Added Materials ({items.length})</span>
          </h4>
          {totalEstWeight > 0 && (
            <span className="text-xs font-bold text-[#136B3B] bg-[#E6F4EA] px-2.5 py-0.5 rounded-full">
              Total: ~{totalEstWeight.toFixed(1)} kg
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-6 bg-white border border-dashed border-gray-200 rounded-2xl text-gray-400 text-xs">
            No materials added yet. Choose a category and click &quot;Add Material to Pickup&quot;.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => {
              const info = WASTE_CATEGORY_LABELS[item.category];
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl select-none">{info.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-[#191C1E]">{t('categories.' + item.category)}</p>
                      {item.notes && <p className="text-[11px] text-[#6B7280]">{item.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold text-[#136B3B]">{item.approx_weight_kg} kg</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-gray-400 hover:text-rose-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
