import React from 'react';
import { Expense } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../utils/calculations';
import { Clock, Landmark } from 'lucide-react';
import { ROOM_FUND_ID, ROOM_FUND_NAME } from '../data/initialData';

interface ExpenseListItemProps {
  expense: Expense;
  onClick: () => void;
  isLast?: boolean;
}

export const ExpenseListItem: React.FC<ExpenseListItemProps> = ({
  expense,
  onClick,
  isLast = false,
}) => {
  const isBolt = expense.icon === 'bolt' || expense.category === 'Utility';
  const isPending = expense.status === 'pending_approval';
  const isRoomFund = expense.paidById === ROOM_FUND_ID;

  return (
    <div
      id={`expense-item-${expense.id}`}
      onClick={onClick}
      className={`group flex justify-between items-center p-4 transition-colors cursor-pointer ${
        isPending 
          ? 'bg-amber-50/70 hover:bg-amber-100/60 border-l-2 border-l-amber-600' 
          : 'hover:bg-slate-50/80'
      } ${!isLast ? 'border-b border-slate-100' : ''}`}
    >
      <div className="flex items-center gap-4">
        {/* Category Circle Icon */}
        <div
          className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${
            isPending
              ? 'bg-amber-100 border-amber-300 text-amber-800'
              : isBolt
              ? 'bg-slate-100 border-slate-200 text-slate-800'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          {isRoomFund ? (
            <Landmark className="w-5 h-5 text-slate-800" />
          ) : (
            <CategoryIcon category={expense.category} iconName={expense.icon} />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-semibold text-slate-900 group-hover:text-slate-800 transition-colors">
              {expense.title}
            </span>
            {isPending && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] leading-3 text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 font-semibold">
                <Clock className="w-2.5 h-2.5" /> Pending Approval
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium border border-slate-200">
              {expense.category}
            </span>
            <span className="text-[13px] text-slate-500">
              Paid by{' '}
              <span className="text-slate-800 font-semibold">
                {isRoomFund ? ROOM_FUND_NAME : expense.paidByName || 'Member'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Amount in Tabular Mono */}
      <div className="text-right shrink-0">
        <div className={`font-mono-numbers text-[16px] md:text-[17px] font-bold tracking-tight ${
          isPending ? 'text-amber-800' : 'text-slate-900'
        }`}>
          {formatCurrency(expense.amount)}
        </div>
        {isPending && (
          <span className="text-[10px] font-mono text-amber-700 block">
            not in ledger
          </span>
        )}
      </div>
    </div>
  );
};

