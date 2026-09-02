import React, { useState } from 'react';
import { 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Split, 
  ArrowRight,
  AlertCircle,
  Zap,
  Repeat
} from 'lucide-react';
import { Bill, User, CategoryType } from '../types';
import { formatCurrency, formatExactCurrency } from '../utils/calculations';
import { CategoryIcon } from './CategoryIcon';

interface BillsViewProps {
  bills: Bill[];
  users: User[];
  onTogglePaidBill: (billId: string) => void;
  onConvertBillToExpense: (bill: Bill) => void;
  onAddBill: (billData: Partial<Bill>) => void;
}

export const BillsView: React.FC<BillsViewProps> = ({
  bills,
  users,
  onTogglePaidBill,
  onConvertBillToExpense,
  onAddBill,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('Utility');
  const [dueDate, setDueDate] = useState('2026-09-01');
  const [recurring, setRecurring] = useState<'monthly' | 'weekly' | 'none'>('monthly');
  const [notes, setNotes] = useState('');

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    onAddBill({
      title: title.trim(),
      amount: numAmount,
      category,
      dueDate,
      recurring,
      isPaid: false,
      notes: notes.trim() || undefined,
      splitWithIds: users.map((u) => u.id),
    });

    setTitle('');
    setAmount('');
    setNotes('');
    setShowAddModal(false);
  };

  const unpaidBills = bills.filter((b) => !b.isPaid);
  const paidBills = bills.filter((b) => b.isPaid);

  const totalUnpaid = unpaidBills.reduce((acc, b) => acc + b.amount, 0);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-[1280px] mx-auto pt-3 md:pt-4">
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-row justify-between items-center gap-3">
        <div className="min-w-0">
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-slate-500 font-semibold block">
            Group Shared Bills
          </span>
          <h2 className="text-[18px] sm:text-[22px] font-bold text-slate-900 mt-0.5 truncate">
            Recurring & Utilities
          </h2>
          <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5 truncate">
            Total Pending: <span className="text-slate-900 font-mono font-bold">{formatCurrency(totalUnpaid)}</span>
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="shrink-0 inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[12px] sm:text-[13px] shadow-sm shadow-slate-900/20 transition-all active:scale-95 cursor-pointer border border-slate-800"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Add Shared Bill</span>
          <span className="sm:hidden">Add Bill</span>
        </button>
      </div>

      {/* Unpaid Section */}
      <section className="space-y-3.5">
        <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-700" /> Upcoming & Due Bills ({unpaidBills.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {unpaidBills.map((bill) => (
            <div
              key={bill.id}
              className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between gap-4 hover:border-slate-300 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                    <CategoryIcon category={bill.category} />
                  </div>
                  <div>
                    <h4 className="text-[16px] font-bold text-slate-900">{bill.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {bill.category}
                      </span>
                      <span className="text-[12px] text-slate-600 font-mono font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Due {bill.dueDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[18px] font-bold text-slate-900 font-mono font-mono-numbers">
                    {formatCurrency(bill.amount)}
                  </span>
                  <span className="block text-[11px] font-mono text-slate-500">
                    ₹{(bill.amount / (users.length || 1)).toFixed(0)}/person
                  </span>
                </div>
              </div>

              {bill.notes && (
                <p className="text-[12px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                  {bill.notes}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[12px]">
                <span className="text-slate-500 font-mono capitalize flex items-center gap-1">
                  <Repeat className="w-3.5 h-3.5 text-slate-400" /> {bill.recurring}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onConvertBillToExpense(bill)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition-colors border border-slate-200"
                    title="Pay and convert to split expense in ledger"
                  >
                    <Split className="w-3.5 h-3.5 text-slate-700" /> Pay & Split
                  </button>
                  <button
                    onClick={() => onTogglePaidBill(bill.id)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                  >
                    Mark Paid
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Paid Bills Section */}
      {paidBills.length > 0 && (
        <section className="space-y-3 pt-4">
          <h3 className="text-[15px] font-bold text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Settled / Paid Bills ({paidBills.length})
          </h3>

          <div className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden divide-y divide-slate-100">
            {paidBills.map((bill) => (
              <div
                key={bill.id}
                className="p-4 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-medium text-slate-500 line-through">
                      {bill.title}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      Paid on due date: {bill.dueDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-[14px] text-slate-400 line-through font-mono-numbers">
                    {formatCurrency(bill.amount)}
                  </span>
                  <button
                    onClick={() => onTogglePaidBill(bill.id)}
                    className="text-[11px] font-mono text-slate-700 hover:text-slate-900 hover:underline font-semibold cursor-pointer"
                  >
                    Reopen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add Bill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-[18px] font-bold text-slate-900">Add Shared Bill</h3>
            <form onSubmit={handleCreateBill} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1 font-semibold">
                  Bill Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WiFi Fiber, House Rent, Maid Salary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none text-[13px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1 font-semibold">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none text-[14px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1 font-semibold">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3 py-2 text-slate-900 font-mono outline-none text-[13px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1 font-semibold">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryType)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none text-[13px]"
                  >
                    <option value="Utility">Utility</option>
                    <option value="Rent">Rent</option>
                    <option value="Household">Household</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Food">Food</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1 font-semibold">
                    Recurrence
                  </label>
                  <select
                    value={recurring}
                    onChange={(e) => setRecurring(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none text-[13px]"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="none">One-time</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1 font-semibold">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Account number, vendor info..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3 py-2 text-slate-900 text-[13px] outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-[13px] hover:bg-slate-800 shadow-sm border border-slate-800 cursor-pointer"
                >
                  Create Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
