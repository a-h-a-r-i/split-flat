import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  ArrowRight, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Check, 
  Building, 
  CreditCard,
  User as UserIcon,
  Crown
} from 'lucide-react';
import { User, RoomDeposit } from '../types';
import { CURRENT_DATE_STRING } from '../utils/calculations';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  onSaveDeposit: (depositData: Partial<RoomDeposit>) => void;
  collectionGoalAmount?: number;
  hostUpiId?: string;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onSaveDeposit,
  collectionGoalAmount,
  hostUpiId = 'ayyapureddiharinadh@okhdfcbank',
}) => {
  const isHost = currentUser.role === 'host';
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [amount, setAmount] = useState(collectionGoalAmount ? String(collectionGoalAmount) : '');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('UPI');
  const [date, setDate] = useState(CURRENT_DATE_STRING);
  const [notes, setNotes] = useState(collectionGoalAmount ? 'August Room Fund Top-Up Deposit' : '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const depositingUser = users.find((u) => u.id === selectedUserId) || currentUser;

    onSaveDeposit({
      userId: depositingUser.id,
      userName: depositingUser.name,
      userAvatar: depositingUser.avatar,
      amount: numAmount,
      date,
      paymentMethod,
      notes: notes.trim() || `Handed over ${paymentMethod} to Room Fund`,
      status: isHost ? 'approved' : 'pending_approval',
      submittedAt: new Date().toISOString(),
      approvedBy: isHost ? currentUser.id : undefined,
      approvedAt: isHost ? new Date().toISOString() : undefined,
    });

    // Reset & close
    setAmount('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-slate-900 leading-tight">
                {isHost ? 'Record Room Money Deposit' : 'Hand Over Money to Room Pool'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Flat 402 • Common Fund Ledger</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice banner */}
        {!isHost ? (
          <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-[12px] text-amber-900 shrink-0">
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Your handover will be submitted to <strong>Host Harinadh</strong> for verification before adding to the Room Pool.
            </span>
          </div>
        ) : (
          <div className="px-5 py-2 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2 text-[12px] text-emerald-800 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Host Mode:</strong> Deposits logged here are immediately added to the active Room Money balance.
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Amount Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-mono uppercase text-slate-600 font-semibold">
                Handover Amount (₹ INR) *
              </label>
              {collectionGoalAmount && (
                <button
                  type="button"
                  onClick={() => setAmount(String(collectionGoalAmount))}
                  className="text-[11px] font-mono text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 font-bold transition-colors cursor-pointer"
                >
                  Quick Fill Target: ₹{collectionGoalAmount.toLocaleString('en-IN')}
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[26px] font-bold text-slate-400 font-mono">
                ₹
              </span>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-slate-900 focus:bg-white rounded-2xl pl-10 pr-4 py-3 text-[26px] font-bold text-slate-900 font-mono outline-none transition-all shadow-2xs"
                autoFocus
              />
            </div>

            {/* Quick preset amount chips */}
            <div className="flex items-center gap-1.5 mt-2">
              {[1000, 2000, 3000, 5000, 10000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border transition-colors cursor-pointer ${
                    amount === String(preset)
                      ? 'bg-slate-900 text-white border-slate-900 font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ₹{preset.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Member Selection (Host can choose who deposited; Member is locked to self) */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase text-slate-600 font-semibold">
              Who is Handing Over Money?
            </label>
            
            {isHost ? (
              <div className="grid grid-cols-2 gap-2">
                {users.map((u) => {
                  const isSelected = selectedUserId === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUserId(u.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs font-semibold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-300 shrink-0">
                        <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[12px] font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {u.name} {u.id === currentUser.id ? '(You)' : ''}
                        </p>
                        <p className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {u.role}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-300 shrink-0">
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-900">{currentUser.name} (You)</h4>
                    <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                  Sender
                </span>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-600 font-semibold mb-1.5">
              Handover Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['UPI', 'Cash', 'Bank Transfer'] as const).map((method) => {
                const isSelected = paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2.5 px-2 rounded-xl text-[12px] font-semibold border transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-600 font-semibold mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-[13px] text-slate-900 outline-none focus:border-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-600 font-semibold mb-1">
                Note / Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Monthly deposit for groceries"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-[13px] text-slate-900 outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-[13px] font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-[13px] hover:bg-slate-800 shadow-xs border border-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isHost ? 'Add to Room Money' : 'Submit Handover'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
