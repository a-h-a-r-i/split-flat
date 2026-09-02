import React, { useState } from 'react';
import { X, Calendar, ArrowRight } from 'lucide-react';

interface CustomDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  onApplyRange: (start: string, end: string) => void;
}

export const CustomDateModal: React.FC<CustomDateModalProps> = ({
  isOpen,
  onClose,
  startDate,
  endDate,
  onApplyRange,
}) => {
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyRange(start, end);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-slate-900">Custom Date Range</h3>
              <p className="text-[12px] text-slate-500">Filter expenses by date span</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-500 font-semibold mb-1">
              Start Date
            </label>
            <input
              type="date"
              required
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3 py-2 text-slate-900 font-mono text-[13px] outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-500 font-semibold mb-1">
              End Date
            </label>
            <input
              type="date"
              required
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3 py-2 text-slate-900 font-mono text-[13px] outline-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-[13px] hover:bg-slate-800 shadow-sm flex items-center justify-center gap-1.5 border border-slate-800 cursor-pointer"
            >
              <span>Apply Filter</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
