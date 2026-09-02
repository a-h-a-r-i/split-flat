import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Mail, 
  ArrowRight, 
  Users, 
  CheckCircle2, 
  Crown, 
  Shield, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { User, MemberInvite } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginWithEmail: (email: string, remember?: boolean, flatId?: string) => { success: boolean; matchingFlats: any[]; error?: string };
  users: User[];
  invites?: MemberInvite[];
  flatName?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginWithEmail,
  users,
  invites = [],
  flatName = 'Flat Ledger',
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmed = emailInput.trim();
    if (!trimmed) return;

    const res = onLoginWithEmail(trimmed, true);
    if (res.success) {
      setSuccessMessage(`Welcome back! Logged in as ${trimmed}`);
      setTimeout(() => {
        onClose();
        setEmailInput('');
        setSuccessMessage('');
      }, 1200);
    } else {
      setErrorMessage(
        res.error ||
        'Email not found in registered roommates or active invitations. Ask the Host for an invite.'
      );
    }
  };

  const handleQuickSelect = (email: string) => {
    setEmailInput(email);
    const res = onLoginWithEmail(email, true);
    if (res.success) {
      setSuccessMessage(`Signed in as ${email}`);
      setTimeout(() => {
        onClose();
        setEmailInput('');
        setSuccessMessage('');
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-slate-900">Sign in to {flatName}</h3>
              <p className="text-[12px] text-slate-500">Access your ledger with your email ID</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[12px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Email input form */}
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-500 font-semibold mb-1">
                Your Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@flat402.local, priya@flat402.local"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-[13px] text-slate-900 font-mono outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-[13px] hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer border border-slate-800"
            >
              <span>Continue with Email</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Click Roommate Profiles */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Demo Role Accounts (1-Click Test)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">1-Click Switch</span>
            </div>

            <div className="space-y-2">
              {users.map((u) => {
                const isHost = u.role === 'host';
                const isCoHost = u.role === 'co-host';
                const badgeColor = isHost
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : isCoHost
                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300';

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelect(u.email)}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-left transition-all group cursor-pointer active:scale-[0.99] bg-white shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                        <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-slate-950">
                            {u.name}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border flex items-center gap-0.5 ${badgeColor}`}>
                            {isHost && <Crown className="w-2.5 h-2.5 text-amber-600" />}
                            {isCoHost && <Shield className="w-2.5 h-2.5 text-blue-600" />}
                            {!isHost && !isCoHost && <Users className="w-2.5 h-2.5 text-emerald-600" />}
                            <span className="capitalize">{u.role} View</span>
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 block truncate mt-0.5">
                          {u.email}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2">
                      →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
