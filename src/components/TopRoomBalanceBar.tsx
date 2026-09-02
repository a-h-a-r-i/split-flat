import React, { useState } from 'react';
import { 
  Building, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Send, 
  Check, 
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { RoomFundSummary, formatCurrency } from '../utils/calculations';
import { User } from '../types';

interface TopRoomBalanceBarProps {
  roomFundSummary: RoomFundSummary;
  currentUser: User;
  activeUsersCount: number;
  onOpenDepositModal: () => void;
  onRequestContribution: (deficitAmount: number, perPersonShare: number) => void;
  onNavigateToDashboard?: () => void;
}

export const TopRoomBalanceBar: React.FC<TopRoomBalanceBarProps> = ({
  roomFundSummary,
  currentUser,
  activeUsersCount,
  onOpenDepositModal,
  onRequestContribution,
  onNavigateToDashboard,
}) => {
  const isHost = currentUser.role === 'host';
  const isDeficit = roomFundSummary.availableBalance < 0;
  const deficitAmount = Math.abs(roomFundSummary.availableBalance);
  const perPersonShare = Math.ceil(deficitAmount / Math.max(1, activeUsersCount));

  const [hasSentNotice, setHasSentNotice] = useState(false);

  const handleSendReminder = () => {
    onRequestContribution(deficitAmount, perPersonShare);
    setHasSentNotice(true);
    setTimeout(() => setHasSentNotice(false), 4000);
  };

  return (
    <div className="w-full mb-3 md:mb-4">
      {/* 1. Main Top Room Money Card - Clean Light App Theme */}
      <div 
        className={`w-full rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-white border transition-all shadow-xs ${
          isDeficit 
            ? 'border-rose-300 bg-rose-50/40 ring-1 ring-rose-200' 
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Remaining Balance Metric */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div 
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                isDeficit 
                  ? 'bg-rose-100 text-rose-600 border-rose-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isDeficit ? (
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Building className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
                  Remaining Room Balance Left
                </span>
                {isDeficit ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wider">
                    Deficit (Overspent)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Fund
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2 mt-0.5">
                <h3 
                  className={`text-[26px] sm:text-[32px] font-bold tracking-tight font-mono-numbers ${
                    isDeficit ? 'text-rose-600' : 'text-slate-900'
                  }`}
                >
                  {formatCurrency(roomFundSummary.availableBalance)}
                </h3>
                <span className="text-[12px] text-slate-500 font-medium hidden sm:inline">
                  {isDeficit ? 'spent exceeds collected' : 'available in flat pool'}
                </span>
              </div>
            </div>
          </div>

          {/* Center/Right: Total Collected & Total Spent stats + Handover Button */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Stat Pill: Total Collected */}
            <div className="flex-1 sm:flex-initial p-2.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-50 border border-slate-200/80 min-w-[130px]">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-slate-500 font-semibold">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span>Total Collected</span>
              </div>
              <span className="text-[14px] sm:text-[15px] font-bold font-mono text-slate-900 mt-0.5 block font-mono-numbers">
                {formatCurrency(roomFundSummary.totalCollected)}
              </span>
            </div>

            {/* Stat Pill: Total Spent */}
            <div className="flex-1 sm:flex-initial p-2.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-50 border border-slate-200/80 min-w-[130px]">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-slate-500 font-semibold">
                <TrendingDown className="w-3 h-3 text-rose-600" />
                <span>Total Spent</span>
              </div>
              <span className="text-[14px] sm:text-[15px] font-bold font-mono text-slate-900 mt-0.5 block font-mono-numbers">
                {formatCurrency(roomFundSummary.totalSpent)}
              </span>
            </div>

            {/* Action: Add Money / Hand Over */}
            <button
              onClick={onOpenDepositModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 border border-emerald-600"
            >
              <Wallet className="w-4 h-4" />
              <span>{isHost ? '+ Record Deposit' : '+ Hand Over Money'}</span>
            </button>
          </div>
        </div>

        {/* 2. Urgent Deficit Alert & Notification Broadcast Bar */}
        {isDeficit && (
          <div className="mt-3.5 pt-3.5 border-t border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-rose-50/80 p-3 rounded-xl border border-rose-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-[12px] leading-snug">
                <span className="font-bold text-rose-900 block">
                  Deficit Alert: Room pool is overspent by {formatCurrency(deficitAmount)}!
                </span>
                <span className="text-rose-700 text-[11px]">
                  Split equally across all <span className="font-bold text-slate-900">{activeUsersCount} roommates</span>: <span className="font-bold text-rose-900 font-mono bg-white px-1.5 py-0.5 rounded border border-rose-200">₹{perPersonShare.toLocaleString('en-IN')}/person</span> to replenish.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleSendReminder}
                disabled={hasSentNotice}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all shadow-xs cursor-pointer ${
                  hasSentNotice
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95'
                }`}
              >
                {hasSentNotice ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Notification Sent to Everyone!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Notify Everyone to Add ₹{perPersonShare.toLocaleString('en-IN')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
