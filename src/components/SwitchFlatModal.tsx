import React, { useState } from 'react';
import { 
  Building, 
  Plus, 
  Check, 
  X, 
  ShieldCheck, 
  ArrowRight, 
  Users, 
  Crown,
  ChevronRight
} from 'lucide-react';
import { FlatGroup, User } from '../types';

interface SwitchFlatModalProps {
  isOpen: boolean;
  onClose: () => void;
  flats: FlatGroup[];
  activeFlatId: string;
  onSelectFlat: (flatId: string) => void;
  onCreateFlat: (flatData: { name: string; building?: string; address?: string }) => void;
  currentUser: User;
}

export const SwitchFlatModal: React.FC<SwitchFlatModalProps> = ({
  isOpen,
  onClose,
  flats,
  activeFlatId,
  onSelectFlat,
  onCreateFlat,
  currentUser,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFlatName, setNewFlatName] = useState('');
  const [newBuilding, setNewBuilding] = useState('');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlatName.trim()) return;

    onCreateFlat({
      name: newFlatName.trim(),
      building: newBuilding.trim() || undefined,
    });
    setNewFlatName('');
    setNewBuilding('');
    setIsCreating(false);
    onClose();
  };

  // Filter flats where current user's email is a member or creator
  const userFlats = flats.filter(
    (f) =>
      f.memberEmails?.some((e) => e.toLowerCase() === currentUser.email?.toLowerCase()) ||
      f.createdByEmail?.toLowerCase() === currentUser.email?.toLowerCase()
  );

  const displayFlats = userFlats.length > 0 ? userFlats : flats;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-slate-900">
                {isCreating ? 'Create New Flat' : 'Switch Flat / Group'}
              </h3>
              <p className="text-[12px] text-slate-500">
                {isCreating ? 'Set up a new apartment ledger' : `Signed in as ${currentUser.email}`}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {!isCreating ? (
            <>
              <div className="space-y-2">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                  Your Available Flats ({displayFlats.length})
                </label>

                <div className="space-y-2">
                  {displayFlats.map((flat) => {
                    const isActive = flat.id === activeFlatId;
                    const isCreator = flat.createdByEmail?.toLowerCase() === currentUser.email?.toLowerCase();

                    return (
                      <button
                        key={flat.id}
                        type="button"
                        onClick={() => {
                          onSelectFlat(flat.id);
                          onClose();
                        }}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                          isActive
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-900 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800'
                          }`}>
                            <Building className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[14px] truncate">
                                {flat.name}
                              </span>
                              {isCreator && (
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                                  isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}>
                                  <Crown className="w-2.5 h-2.5" /> Host
                                </span>
                              )}
                            </div>
                            <p className={`text-[11px] truncate mt-0.5 ${
                              isActive ? 'text-slate-300' : 'text-slate-500'
                            }`}>
                              {flat.building || `${flat.memberEmails?.length || 1} roommates connected`}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 ml-2">
                          {isActive ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold bg-white text-slate-900 px-2 py-0.5 rounded-full">
                              <Check className="w-3 h-3 stroke-[3]" /> Active
                            </span>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-slate-800 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-slate-800" />
                  <span>Create Another Flat / Apartment</span>
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1">
                  Flat or Apartment Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 302, Skyline Residency 4B"
                  value={newFlatName}
                  onChange={(e) => setNewFlatName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1">
                  Building / Floor / Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Block C, 3rd Floor"
                  value={newBuilding}
                  onChange={(e) => setNewBuilding(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                You will become the <strong>Host</strong> of this new flat and can invite your roommates via their email addresses.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Create Flat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
