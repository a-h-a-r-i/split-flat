import React, { useState } from 'react';
import { X, Target, Building, Users, AlertCircle, Check } from 'lucide-react';
import { FlatGroup, FundCollectionCall } from '../types';

interface SetCollectionModalProps {
  isOpen: boolean;
  activeFlat: FlatGroup;
  roommatesCount: number;
  onClose: () => void;
  onSaveCollectionCall: (call: FundCollectionCall | null) => void;
}

export const SetCollectionModal: React.FC<SetCollectionModalProps> = ({
  isOpen,
  activeFlat,
  roommatesCount,
  onClose,
  onSaveCollectionCall,
}) => {
  if (!isOpen || !activeFlat) return null;
  const currentCall = activeFlat.fundCollectionCall;

  const [perPersonAmount, setPerPersonAmount] = useState<string>(
    currentCall ? String(currentCall.amountPerPerson) : '5000'
  );
  const [title, setTitle] = useState<string>(
    currentCall?.title || `${new Date().toLocaleString('default', { month: 'long' })} Room Fund Collection`
  );
  const [notes, setNotes] = useState<string>(
    currentCall?.notes || 'Common flat deposit for groceries, utilities, and room maintenance.'
  );

  const parsedAmount = parseFloat(perPersonAmount) || 0;
  const totalTarget = parsedAmount * Math.max(1, roommatesCount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) return;

    const newCall: FundCollectionCall = {
      active: true,
      amountPerPerson: parsedAmount,
      totalTarget,
      title: title.trim() || 'Room Money Collection',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      createdBy: 'Host',
    };

    onSaveCollectionCall(newCall);
    onClose();
  };

  const handleStopCollection = () => {
    onSaveCollectionCall(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-900">
                Fix Room Collection Amount
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Set required deposit per roommate to fund room pool
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-500 font-semibold mb-1">
              Required Amount per Roommate (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[22px] font-bold text-slate-400 font-mono">
                ₹
              </span>
              <input
                type="number"
                step="any"
                required
                min="100"
                placeholder="5000"
                value={perPersonAmount}
                onChange={(e) => setPerPersonAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-2xl pl-10 pr-4 py-3 text-[24px] font-bold text-slate-900 font-mono outline-none transition-all shadow-xs"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[12px] bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {roommatesCount} Roommates
              </span>
              <span className="font-mono font-bold text-slate-900">
                Total Room Pool Target: ₹{totalTarget.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-500 font-semibold mb-1">
              Collection Call Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. August Flat Fund Collection"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] text-slate-900 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-500 font-semibold mb-1">
              Purpose / Message to Roommates
            </label>
            <textarea
              rows={2}
              placeholder="e.g. For monthly common groceries, utilities, and emergency fund."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-xl px-4 py-2.5 text-[13px] text-slate-900 outline-none transition-all resize-none"
            />
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[12px] text-emerald-900 flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              When saved, an alert banner will notify all roommates to deposit <strong>₹{parsedAmount.toLocaleString('en-IN')}</strong>. Once approved, it will show in their personal room balance.
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {currentCall?.active && (
              <button
                type="button"
                onClick={handleStopCollection}
                className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-[13px] font-semibold transition-colors cursor-pointer"
              >
                End Call
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-[13px] font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold shadow-xs transition-all cursor-pointer"
            >
              Broadcast Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
