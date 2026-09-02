import React, { useState } from 'react';
import {
  Mail, ArrowRight, CheckCircle2, AlertCircle,
  Building, User as UserIcon, UserPlus, LogIn, ShieldCheck,
} from 'lucide-react';
import { FlatGroup } from '../types';

interface LoginPageProps {
  flats: FlatGroup[];
  onLoginWithEmail: (email: string, remember?: boolean, flatId?: string) => {
    success: boolean;
    matchingFlats: FlatGroup[];
    error?: string;
  };
  onGoogleSignIn: () => Promise<{ success: boolean; email?: string; error?: string; needsFlat?: boolean }>;
  onCreateAccountAndFlat: (data: {
    userName: string;
    email: string;
    flatName: string;
    building?: string;
  }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  flats,
  onLoginWithEmail,
  onGoogleSignIn,
  onCreateAccountAndFlat,
}) => {
  const [tab, setTab] = useState<'signin' | 'create'>('signin');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [flatName, setFlatName] = useState('');
  const [building, setBuilding] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [matchingFlats, setMatchingFlats] = useState<FlatGroup[]>([]);
  const [pendingEmail, setPendingEmail] = useState('');

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError('Please enter your email.'); return; }
    const result = onLoginWithEmail(trimmed, true);
    if (result.success) {
      setSuccess('Welcome back! Loading your flat…');
    } else if (result.matchingFlats.length > 1) {
      setPendingEmail(trimmed);
      setMatchingFlats(result.matchingFlats);
    } else {
      setError(result.error || 'Email not found in any flat. Ask your Host to invite you, or create a new flat.');
    }
  };

  const handleFlatSelect = (flatId: string) => {
    const result = onLoginWithEmail(pendingEmail, true, flatId);
    if (result.success) setSuccess('Entering your flat…');
  };

  const handleGoogleClick = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const result = await onGoogleSignIn();
      if (result.success) {
        setSuccess('Signed in! Loading your flat…');
      } else if (result.needsFlat) {
        setTab('create');
        if (result.email) setEmail(result.email);
        setError('Your Google account is not linked to any flat yet. Create one below.');
      } else {
        setError(result.error || 'Google sign-in failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!name.trim() || !email.trim() || !flatName.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    onCreateAccountAndFlat({
      userName: name.trim(),
      email: email.trim().toLowerCase(),
      flatName: flatName.trim(),
      building: building.trim() || undefined,
    });
    setSuccess('Flat created! Setting up your ledger…');
  };

  // Multiple flats selection screen
  if (matchingFlats.length > 1) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 px-6 py-5 text-white">
            <h1 className="text-lg font-bold">Select Your Flat</h1>
            <p className="text-xs text-slate-400 mt-1">{pendingEmail} is a member of multiple flats</p>
          </div>
          <div className="p-4 space-y-2">
            {matchingFlats.map((f) => (
              <button key={f.id} onClick={() => handleFlatSelect(f.id)}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-left cursor-pointer transition-all group">
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{f.name}</p>
                  <p className="text-xs text-slate-500 truncate">{f.building || `${f.memberEmails?.length || 1} members`}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 ml-auto" />
              </button>
            ))}
            <button onClick={() => setMatchingFlats([])} className="w-full text-xs text-slate-500 hover:text-slate-800 pt-2 cursor-pointer">← Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 px-6 py-6 text-white">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-black tracking-tight">EquityHub</h1>
          </div>
          <p className="text-xs text-slate-400">Apartment Expense & Room Money Ledger</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Tab switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button onClick={() => { setTab('signin'); setError(''); setSuccess(''); }}
              className={`py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${tab === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
            <button onClick={() => { setTab('create'); setError(''); setSuccess(''); }}
              className={`py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${tab === 'create' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              <UserPlus className="w-3.5 h-3.5" /> Create Account
            </button>
          </div>

          {/* Google Sign In */}
          <button onClick={handleGoogleClick} disabled={loading}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 hover:border-slate-800 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm flex items-center justify-center gap-3 cursor-pointer transition-all disabled:opacity-60 shadow-sm">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.28 21.43 7.36 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.1z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.28 2.57 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z" />
            </svg>
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">or with email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Error / Success */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Sign In form */}
          {tab === 'signin' && (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" required placeholder="yourname@gmail.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition-all"
                    autoFocus />
                </div>
                <p className="text-[11px] text-slate-400">Enter the email your Flat Host registered or invited you with.</p>
              </div>
              <button type="submit"
                className="w-full h-11 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 flex items-center justify-center gap-2 cursor-pointer transition-all">
                Sign In to Flat <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-xs text-slate-500">
                Don't have a flat?{' '}
                <button type="button" onClick={() => setTab('create')} className="font-bold text-slate-900 hover:underline cursor-pointer">Create one</button>
              </p>
            </form>
          )}

          {/* Create Account form */}
          {tab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Your Full Name *</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" required placeholder="e.g. Harinadh Reddy"
                    value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition-all" autoFocus />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" required placeholder="yourname@gmail.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition-all" />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Flat / Apartment Name *</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" required placeholder="e.g. Flat 402, Sunshine Heights"
                    value={flatName} onChange={(e) => setFlatName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Building / Floor <span className="text-slate-400 font-normal">(optional)</span></label>
                <input type="text" placeholder="e.g. Block C, 3rd Floor"
                  value={building} onChange={(e) => setBuilding(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none transition-all" />
              </div>
              <button type="submit"
                className="w-full h-11 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 flex items-center justify-center gap-2 cursor-pointer transition-all mt-2">
                Create Flat & Join as Host <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-xs text-slate-500">
                Already have a flat?{' '}
                <button type="button" onClick={() => setTab('signin')} className="font-bold text-slate-900 hover:underline cursor-pointer">Sign in</button>
              </p>
            </form>
          )}

          {/* Security note */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure · Real-time sync · Firebase Auth</span>
          </div>
        </div>
      </div>
    </div>
  );
};
