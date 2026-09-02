import React from 'react';
import { 
  X, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Calendar, 
  User as UserIcon, 
  Tag, 
  Receipt,
  FileText,
  Share2,
  Check,
  Building,
  Crown
} from 'lucide-react';
import { Expense, User } from '../types';
import { formatCurrency, formatExactCurrency } from '../utils/calculations';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseDetailModalProps {
  expense: Expense;
  users: User[];
  currentUser: User;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
  onApprove?: (expenseId: string) => void;
  onReject?: (expenseId: string) => void;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  expense,
  users,
  currentUser,
  onClose,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}) => {
  const isHost = currentUser.role === 'host';
  const isCoHost = currentUser.role === 'co-host';
  const isHostOrCoHost = isHost || isCoHost;
  const isPending = expense.status === 'pending_approval';
  const isDeclined = expense.status === 'rejected';

  const payer = users.find((u) => u.id === expense.paidById);
  const isRoomFund = expense.paidById === 'room-fund';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <CategoryIcon category={expense.category} iconName={expense.icon} className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-slate-500 font-semibold">{expense.category}</span>
              <h3 className="text-[16px] font-bold text-slate-900 leading-tight">Expense Receipt</h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(expense)}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Edit Expense"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this expense?')) {
                  onDelete(expense.id);
                }
              }}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Delete Expense"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Main Title & Total Amount */}
          <div className="text-center py-2 space-y-1">
            <h2 className="text-[20px] font-bold text-slate-900">{expense.title}</h2>
            <div className="text-[34px] font-bold font-mono text-slate-900 font-mono-numbers">
              {formatExactCurrency(expense.amount)}
            </div>

            <div className="flex justify-center mt-2">
              {isPending && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Host Approval
                </span>
              )}
              {isDeclined && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" /> Declined by Host
                </span>
              )}
              {!isPending && !isDeclined && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved & Recorded
                </span>
              )}
            </div>
          </div>

          {/* Host / Co-Host Approval Action Box (If Pending) */}
          {isPending && isHostOrCoHost && onApprove && onReject && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-amber-900 uppercase font-mono">
                  {isHost ? 'Host' : 'Co-Host'} Verification Required
                </span>
                <Crown className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-[12px] text-amber-800 leading-relaxed">
                Approve this transaction to integrate it into the official Flat 402 group balance sheet.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onApprove(expense.id)}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[13px] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" /> Approve
                </button>
                <button
                  onClick={() => onReject(expense.id)}
                  className="flex-1 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold text-[13px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X className="w-4 h-4" /> Decline
                </button>
              </div>
            </div>
          )}

          {/* Transaction Metadata */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-[13px]">
            <div>
              <span className="block text-[11px] font-mono uppercase text-slate-500 font-semibold">
                Paid By
              </span>
              <div className="flex items-center gap-2 mt-1">
                {isRoomFund ? (
                  <>
                    <Building className="w-4 h-4 text-slate-700" />
                    <span className="font-bold text-slate-900">Room Fund</span>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-300">
                      <img src={payer?.avatar} alt={payer?.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold text-slate-900">{expense.paidByName || 'Member'}</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-mono uppercase text-slate-500 font-semibold">
                Date Logged
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-slate-900 font-medium font-mono">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{expense.date}</span>
              </div>
            </div>
          </div>

          {/* Notes / Comments */}
          {expense.notes && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="block text-[11px] font-mono uppercase text-slate-500 font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Note & Memo
              </span>
              <p className="text-[13px] text-slate-700 italic">
                "{expense.notes}"
              </p>
            </div>
          )}

          {/* Roommates Split Breakdown */}
          <div className="space-y-2.5">
            <span className="block text-[12px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Split Breakdown ({expense.splitShares.length} Roommates)
            </span>

            <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden divide-y divide-slate-100">
              {expense.splitShares.map((share) => {
                const user = users.find((u) => u.id === share.userId);
                return (
                  <div key={share.userId} className="p-3 flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-300">
                        <img src={user?.avatar} alt={user?.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-semibold text-slate-800">
                        {user?.name || 'Roommate'}
                      </span>
                    </div>

                    <span className="font-mono font-bold text-slate-900 font-mono-numbers">
                      {formatExactCurrency(share.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
