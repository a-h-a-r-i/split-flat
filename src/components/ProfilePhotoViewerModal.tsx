import React, { useEffect } from 'react';
import { X, User as UserIcon, ZoomIn, Download, ExternalLink, Info, Crown, Shield, Users } from 'lucide-react';
import { User, UserRole } from '../types';

interface ProfilePhotoViewerModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenProfileInfo?: (user: User) => void;
}

export const ProfilePhotoViewerModal: React.FC<ProfilePhotoViewerModalProps> = ({
  user,
  isOpen,
  onClose,
  onOpenProfileInfo,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'host':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Crown className="w-3 h-3 text-amber-400" /> Host
          </span>
        );
      case 'co-host':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-700/80 text-slate-200 border border-slate-600">
            <Shield className="w-3 h-3 text-slate-300" /> Co-Host
          </span>
        );
      case 'member':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <Users className="w-3 h-3 text-slate-400" /> Member
          </span>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md transition-all animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative max-w-md w-full bg-slate-900/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col items-center gap-5 text-white animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-slate-300" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">
                {user.name}
              </h3>
              <p className="text-[11px] text-slate-400">Profile Photo (DP)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenProfileInfo && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProfileInfo(user);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="View Full Profile Info"
              >
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>View Info</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Large Profile Picture Frame */}
        <div className="relative group w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border-4 border-slate-700 shadow-2xl bg-slate-950 flex items-center justify-center">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-full h-full object-cover select-none"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';
            }}
          />

          {/* Status badge */}
          <div className="absolute bottom-4 right-4">
            {user.isOnline ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shadow-lg backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Online</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-900/90 text-slate-400 border border-slate-700 shadow-lg backdrop-blur-xs">
                {user.lastSeen || 'Offline'}
              </span>
            )}
          </div>
        </div>

        {/* User Details Footer */}
        <div className="w-full text-center space-y-1.5 pt-1">
          <div className="flex items-center justify-center gap-2">
            <h4 className="text-lg font-bold text-white tracking-tight">
              {user.name}
            </h4>
            {getRoleBadge(user.role)}
          </div>

          {user.bio && (
            <p className="text-xs text-slate-300 italic max-w-xs mx-auto">
              "{user.bio}"
            </p>
          )}

          {user.phone && (
            <p className="text-xs text-slate-400 font-mono">
              {user.phone}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
