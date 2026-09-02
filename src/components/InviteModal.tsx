import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Mail, 
  Copy, 
  Check, 
  Crown, 
  Shield, 
  Users, 
  Share2, 
  CheckCircle2 
} from 'lucide-react';
import { UserRole } from '../types';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendInvite: (email: string, name: string, role: UserRole) => void;
  hostName: string;
  flatName?: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  onSendInvite,
  hostName,
  flatName = 'Flat 402',
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [copied, setCopied] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const inviteLink = `${window.location.origin}/?invite=${encodeURIComponent(flatName)}-${encodeURIComponent(email || 'new')}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;

    onSendInvite(email.trim(), name.trim(), role);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setEmail('');
      setName('');
      onClose();
    }, 1800);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-slate-900">Invite Roommate</h3>
              <p className="text-[12px] text-slate-500">Send an invitation to {flatName}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-[18px] font-bold text-slate-900">Invitation Sent!</h4>
            <p className="text-[13px] text-slate-600">
              An invitation email has been dispatched to <strong>{email}</strong>. They can now log in using their email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            {/* Host notice */}
            <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-[12px] text-slate-800">
              👑 Invited by Host <strong>{hostName}</strong>. Invitees will be able to log in with their email and submit expenses for approval.
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-500 font-semibold mb-1">
                Roommate's Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sneha Reddy"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl px-3 py-2 text-slate-900 text-[13px] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-500 font-semibold mb-1">
                Roommate's Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="sneha@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl pl-10 pr-3 py-2 text-slate-900 font-mono text-[13px] outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-500 font-semibold mb-1">
                Assign Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('member')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    role === 'member'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[13px]">
                    <Users className={`w-4 h-4 ${role === 'member' ? 'text-white' : 'text-slate-600'}`} /> Member
                  </div>
                  <p className={`text-[11px] mt-0.5 ${role === 'member' ? 'text-slate-300' : 'text-slate-500'}`}>Logs expenses with host approval</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('co-host')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    role === 'co-host'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[13px]">
                    <Shield className={`w-4 h-4 ${role === 'co-host' ? 'text-white' : 'text-slate-700'}`} /> Co-Host
                  </div>
                  <p className={`text-[11px] mt-0.5 ${role === 'co-host' ? 'text-slate-300' : 'text-slate-500'}`}>Can invite others & manage bills</p>
                </button>
              </div>
            </div>

            {/* Direct Link Share */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <label className="block text-[11px] font-mono uppercase text-slate-500 font-semibold">
                Or Share Direct Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-mono text-slate-600 outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-[12px] flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-[13px] hover:bg-slate-800 shadow-sm flex items-center justify-center gap-2 border border-slate-800 cursor-pointer"
              >
                <Send className="w-4 h-4" /> Send Invite
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
