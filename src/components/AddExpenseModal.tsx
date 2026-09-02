import React, { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign, 
  Calendar, 
  Tag, 
  User as UserIcon, 
  Check, 
  Users, 
  AlertCircle,
  FileText,
  Lock,
  Building,
  Crown,
  Shield,
  Clock
} from 'lucide-react';
import { Expense, User, SplitType, SplitShare, CategoryType } from '../types';
import { ROOM_FUND_ID, ROOM_FUND_NAME } from '../data/initialData';
import { CURRENT_DATE_STRING } from '../utils/calculations';
import { CategoryIcon } from './CategoryIcon';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expenseData: Partial<Expense>) => void;
  users: User[];
  currentUser: User;
  editExpense?: Expense | null;
}

const CATEGORIES: CategoryType[] = [
  'Food',
  'Groceries',
  'Household',
  'Utility',
  'Rent',
  'Entertainment',
  'Shopping',
  'Travel',
  'Health',
  'Other',
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSaveExpense,
  users,
  currentUser,
  editExpense,
}) => {
  const isHost = currentUser.role === 'host';

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('Food');
  // Host defaults to Room Fund (Common Pool), Co-host and Member are locked to their own name
  const [paidById, setPaidById] = useState<string>(isHost ? ROOM_FUND_ID : currentUser.id);
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [date, setDate] = useState(CURRENT_DATE_STRING);
  const [notes, setNotes] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(users.map((u) => u.id));
  const [customShares, setCustomShares] = useState<Record<string, string>>({});

  // Reset or populate on open
  useEffect(() => {
    if (editExpense) {
      setTitle(editExpense.title);
      setAmount(editExpense.amount.toString());
      setCategory(editExpense.category);
      setPaidById(editExpense.paidById);
      setSplitType(editExpense.splitType);
      setDate(editExpense.date);
      setNotes(editExpense.notes || '');
      setSelectedUserIds(editExpense.splitShares.map((s) => s.userId));
      const sharesMap: Record<string, string> = {};
      editExpense.splitShares.forEach((s) => {
        sharesMap[s.userId] = s.amount.toString();
      });
      setCustomShares(sharesMap);
    } else {
      setTitle('');
      setAmount('');
      setCategory('Food');
      setPaidById(isHost ? ROOM_FUND_ID : currentUser.id);
      setSplitType('equal');
      setDate(CURRENT_DATE_STRING);
      setNotes('');
      setSelectedUserIds(users.map((u) => u.id));
      setCustomShares({});
    }
  }, [editExpense, isOpen, isHost, currentUser.id, users]);

  if (!isOpen) return null;

  const handleToggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      if (selectedUserIds.length > 1) {
        setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
      }
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleCustomShareChange = (userId: string, val: string) => {
    setCustomShares((prev) => ({
      ...prev,
      [userId]: val,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) {
      alert('Please provide a valid title and positive amount.');
      return;
    }

    let finalSplitShares: SplitShare[] = [];

    if (splitType === 'equal') {
      const perPerson = Math.round((numAmount / selectedUserIds.length) * 100) / 100;
      finalSplitShares = selectedUserIds.map((userId) => ({
        userId,
        amount: perPerson,
      }));
    } else {
      // Custom exact shares
      finalSplitShares = selectedUserIds.map((userId) => ({
        userId,
        amount: parseFloat(customShares[userId] || '0') || 0,
      }));
    }

    const payerUser = users.find((u) => u.id === paidById);
    const paidByName = paidById === ROOM_FUND_ID ? ROOM_FUND_NAME : payerUser?.name || currentUser.name;

    const isReimbursement = paidById !== ROOM_FUND_ID && !isHost;

    onSaveExpense({
      id: editExpense ? editExpense.id : undefined,
      title: title.trim(),
      amount: numAmount,
      category,
      paidById,
      paidByName,
      splitType,
      splitShares: finalSplitShares,
      date,
      notes: notes.trim() || undefined,
      isReimbursementRequest: isReimbursement,
      reimbursementStatus: isReimbursement ? 'pending' : undefined,
      proofNote: isReimbursement ? notes.trim() : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="text-[18px] font-bold text-slate-900">
              {editExpense ? 'Edit Expense' : 'Add New Expense'}
            </h3>
            <p className="text-[12px] text-slate-500">
              {isHost
                ? 'Host Mode: Log direct entry or use Common Room Pool'
                : 'Co-Host / Member Mode: Submit for Host approval'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Approval Notice Banner for Co-Host & Member */}
        {!isHost && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-[12px] text-amber-900">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              This transaction will appear for all roommates as <strong>Pending Host Approval</strong> until verified.
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Amount & Title Input */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-500 font-semibold mb-1">
                Amount (₹ INR) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[24px] font-bold text-slate-400 font-mono">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-2xl pl-10 pr-4 py-3 text-[26px] font-bold text-slate-900 font-mono outline-none transition-all shadow-2xs"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-500 font-semibold mb-1">
                Description / Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Monthly Grocery Run, High-speed WiFi, Electricity"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] text-slate-900 outline-none transition-all"
              />
            </div>
          </div>

          {/* Paid By Selection */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-mono uppercase text-slate-500 font-semibold">
                Payment Source
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {paidById === ROOM_FUND_ID ? 'Deducts from Room Pool' : 'Personal Out-of-Pocket'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaidById(ROOM_FUND_ID)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  paidById === ROOM_FUND_ID
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-[13px]">
                  <Building className={`w-4 h-4 ${paidById === ROOM_FUND_ID ? 'text-white' : 'text-emerald-600'}`} />
                  <span>Room Money (Default)</span>
                </div>
                <p className={`text-[11px] mt-0.5 ${paidById === ROOM_FUND_ID ? 'text-slate-300' : 'text-slate-500'}`}>
                  Spends from collected flat pool
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaidById(currentUser.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  paidById === currentUser.id
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-[13px]">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>{currentUser.name} (My Pocket)</span>
                </div>
                <p className={`text-[11px] mt-0.5 ${paidById === currentUser.id ? 'text-slate-300' : 'text-slate-500'}`}>
                  {isHost ? 'Paid from personal account' : 'Raise Reimbursement Request'}
                </p>
              </button>
            </div>

            {paidById !== ROOM_FUND_ID && !isHost && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Host will verify this expense and send you the reimbursement from the Room Pool or direct settlement.
                </span>
              </div>
            )}
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-500 font-semibold mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CategoryIcon category={cat} className="w-3.5 h-3.5" />
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Mode Selector & Participants */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 font-semibold">
                  Split With Roommates ({selectedUserIds.length}/{users.length})
                </label>
                <span className="text-[11px] text-slate-500">
                  Deselect anyone who is not participating
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserIds(users.map((u) => u.id))}
                  className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold cursor-pointer underline"
                >
                  Select All
                </button>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSplitType('equal')}
                    className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                      splitType === 'equal' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Equally
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitType('exact')}
                    className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                      splitType === 'exact' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>
            </div>

            {/* Roommates Checkbox List */}
            <div className="border border-slate-200 rounded-2xl bg-slate-50/50 p-2 divide-y divide-slate-100 space-y-1">
              {users.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    className={`flex items-center justify-between p-2 pt-2 first:pt-1 rounded-xl transition-colors ${
                      isSelected ? 'hover:bg-white' : 'opacity-60 bg-slate-100/50'
                    }`}
                  >
                    <div
                      onClick={() => handleToggleUser(u.id)}
                      className="flex items-center gap-2.5 cursor-pointer flex-1"
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-300">
                        <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[13px] font-semibold text-slate-800">
                        {u.name} {u.id === currentUser.id && '(You)'}
                      </span>
                    </div>

                    {/* Show calculated or custom input */}
                    <div className="shrink-0 text-right">
                      {isSelected ? (
                        splitType === 'equal' ? (
                          <div className="text-right">
                            <span className="text-[13px] font-bold font-mono text-slate-900">
                              ₹
                              {amount && !isNaN(parseFloat(amount))
                                ? (parseFloat(amount) / selectedUserIds.length).toFixed(0)
                                : '0'}
                            </span>
                            <span className="text-[10px] text-slate-500 block font-mono">Deducted</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-[12px] font-mono text-slate-400">₹</span>
                            <input
                              type="number"
                              step="any"
                              placeholder="0"
                              value={customShares[u.id] || ''}
                              onChange={(e) => handleCustomShareChange(u.id, e.target.value)}
                              className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-[13px] font-mono font-bold text-slate-900 outline-none focus:border-slate-800"
                            />
                          </div>
                        )
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400 italic">
                          ₹0 (Not Included)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Split explanation callout */}
            <div className="p-2.5 rounded-xl bg-slate-100 text-[11px] text-slate-700 flex items-center justify-between">
              <span>
                {paidById === ROOM_FUND_ID ? (
                  <>
                    <strong>Room Money Reduction:</strong> ₹
                    {amount && !isNaN(parseFloat(amount)) && selectedUserIds.length > 0
                      ? (parseFloat(amount) / selectedUserIds.length).toFixed(0)
                      : '0'}
                    /person reduced for {selectedUserIds.length} roommates. {users.length - selectedUserIds.length > 0 && `${users.length - selectedUserIds.length} excluded (₹0 reduction).`}
                  </>
                ) : (
                  <>
                    <strong>Direct Split:</strong> Split among {selectedUserIds.length} roommates.
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Date & Optional Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-500 font-semibold mb-1">
                Transaction Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3 py-2 text-slate-900 text-[13px] font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-500 font-semibold mb-1">
                Notes / Bill Reference
              </label>
              <input
                type="text"
                placeholder="e.g. Swiggy bill, Zepto order ID"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3 py-2 text-slate-900 text-[13px] outline-none"
              />
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 text-[14px] font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[14px] shadow-sm shadow-slate-900/20 transition-all active:scale-[0.98] border border-slate-800 cursor-pointer"
            >
              {editExpense ? 'Update Expense' : isHost ? 'Add to Ledger' : 'Submit for Host Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
