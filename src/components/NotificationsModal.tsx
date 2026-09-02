import React from 'react';
import { 
  X, Bell, Clock, CheckCircle2, Send, CheckCheck, Check, Wallet
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onSelectNotification?: (notif: AppNotification) => void;
  onApproveDeposit?: (depositId: string) => void;
  onRejectDeposit?: (depositId: string) => void;
  pendingDeposits?: { id: string; userName: string; amount: number; paymentMethod: string }[];
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen, onClose, notifications, onMarkAllAsRead, onSelectNotification,
  onApproveDeposit, onRejectDeposit, pendingDeposits = [],
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'approval_request': return <Clock className="w-4 h-4 text-amber-600" />;
      case 'approval_done':    return <CheckCircle2 className="w-4 h-4 text-teal-600" />;
      case 'invite':           return <Send className="w-4 h-4 text-slate-700" />;
      case 'settlement':       return <CheckCheck className="w-4 h-4 text-slate-700" />;
      default:                 return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-slate-900">Notifications</h3>
              <p className="text-[12px] text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-[11px] font-mono text-slate-700 hover:text-slate-900 font-semibold px-2 py-1 cursor-pointer"
              >
                Mark Read
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pending approvals inline — shown at top if any */}
        {pendingDeposits.length > 0 && onApproveDeposit && onRejectDeposit && (
          <div className="px-4 pt-4 space-y-2">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Pending Approvals
            </p>
            {pendingDeposits.map((dep) => (
              <div key={dep.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                      <Wallet className="w-3.5 h-3.5 text-teal-700" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">{dep.userName}</p>
                      <p className="text-[10px] text-slate-500">{dep.paymentMethod} handover</p>
                    </div>
                  </div>
                  <span className="text-[15px] font-bold font-mono text-teal-700">
                    +₹{dep.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onRejectDeposit(dep.id)}
                    className="flex-1 py-1.5 rounded-xl border border-rose-200 text-rose-700 text-[12px] font-semibold hover:bg-rose-50 cursor-pointer transition-colors">
                    Decline
                  </button>
                  <button onClick={() => { onApproveDeposit(dep.id); }}
                    className="flex-1 py-1.5 rounded-xl bg-teal-700 text-white text-[12px] font-bold hover:bg-teal-800 cursor-pointer transition-colors flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                </div>
              </div>
            ))}
            <div className="border-t border-slate-100 mt-2" />
          </div>
        )}

        {/* Notifications List */}
        <div className="p-4 overflow-y-auto divide-y divide-slate-100 space-y-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto stroke-[1.5]" />
              <p className="text-[13px]">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => onSelectNotification && onSelectNotification(n)}
                className={`p-3.5 rounded-2xl flex items-start gap-3 transition-colors cursor-pointer ${
                  n.isRead ? 'bg-white hover:bg-slate-50' : 'bg-slate-100 hover:bg-slate-200/70 border border-slate-200'
                } ${n.type === 'approval_request' ? 'border border-amber-200 bg-amber-50 hover:bg-amber-100' : ''}`}
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {getNotifIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className={`text-[13px] ${n.isRead ? 'font-semibold text-slate-800' : 'font-bold text-slate-900'}`}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">{n.timestamp}</span>
                  </div>
                  <p className="text-[12px] text-slate-600 mt-0.5 leading-snug">{n.message}</p>
                  {n.type === 'approval_request' && pendingDeposits.length === 0 && (
                    <p className="text-[11px] text-amber-600 font-semibold mt-1">Tap to review on Home →</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
