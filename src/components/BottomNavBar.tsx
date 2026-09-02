import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutGrid, 
  ReceiptText, 
  Plus, 
  CalendarDays, 
  Menu, 
  X, 
  Wallet, 
  Building, 
  Split, 
  ArrowRightLeft,
  Building2,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type NavTab = 'home' | 'expenses' | 'bills' | 'chats' | 'more';

interface BottomNavBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenAddExpense: () => void;
  onOpenDepositModal: () => void;
  onOpenAddBill?: () => void;
  onOpenInviteModal?: () => void;
  unreadMessagesCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddExpense,
  onOpenDepositModal,
  onOpenAddBill,
  unreadMessagesCount = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleActionClick = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  // Radial fan-out arc configuration exactly matching the screenshot
  const radialItems = [
    {
      id: 'split-expense',
      label: 'Direct Split Expense',
      icon: Split,
      bgColor: 'bg-[#FF3366]',
      ringColor: 'ring-white',
      shadowColor: 'shadow-[#FF3366]/40',
      // Far Left
      x: -128,
      y: -42,
      size: 'w-[54px] h-[54px]',
      iconSize: 'w-6 h-6',
      action: () => handleActionClick(onOpenAddExpense),
    },
    {
      id: 'room-expense',
      label: 'Room Pool Expense',
      icon: Building2,
      bgColor: 'bg-[#8B5CF6]',
      ringColor: 'ring-white',
      shadowColor: 'shadow-[#8B5CF6]/40',
      // Upper Left
      x: -74,
      y: -108,
      size: 'w-[56px] h-[56px]',
      iconSize: 'w-6 h-6',
      action: () => handleActionClick(onOpenAddExpense),
    },
    {
      id: 'room-deposit',
      label: 'Hand Over Room Money',
      icon: Wallet,
      bgColor: 'bg-[#0284C7]',
      ringColor: 'ring-white',
      shadowColor: 'shadow-[#0284C7]/40',
      // Top Center (largest focus bubble)
      x: 0,
      y: -136,
      size: 'w-[62px] h-[62px]',
      iconSize: 'w-7 h-7',
      action: () => handleActionClick(onOpenDepositModal),
    },
    {
      id: 'recurring-bills',
      label: 'Monthly Recurring Bills',
      icon: Calendar,
      bgColor: 'bg-[#059669]',
      ringColor: 'ring-white',
      shadowColor: 'shadow-[#059669]/40',
      // Upper Right
      x: 74,
      y: -108,
      size: 'w-[56px] h-[56px]',
      iconSize: 'w-6 h-6',
      action: () => {
        if (onOpenAddBill) {
          handleActionClick(onOpenAddBill);
        } else {
          handleActionClick(() => onTabChange('bills'));
        }
      },
    },
    {
      id: 'settle-up',
      label: 'Settle Balance / UPI',
      icon: ArrowRightLeft,
      bgColor: 'bg-[#EA580C]',
      ringColor: 'ring-white',
      shadowColor: 'shadow-[#EA580C]/40',
      // Far Right
      x: 128,
      y: -42,
      size: 'w-[54px] h-[54px]',
      iconSize: 'w-6 h-6',
      action: () => handleActionClick(() => onTabChange('more')),
    },
  ];

  return (
    <>
      {/* Backdrop Scrim Blur Overlay when Speed Dial Arc is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-xs"
          />
        )}
      </AnimatePresence>

      <div ref={menuRef} className="z-50">
        {/* RADIAL ARC SPEED DIAL BUTTONS (Rendered dynamically centered on the FAB button) */}
        <AnimatePresence>
          {isOpen && (
            <div className="fixed bottom-[64px] left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center justify-center">
              {/* Active Item Banner: ONLY displays when user is hovering/touching an action logo */}
              <AnimatePresence>
                {hoveredItem && (
                  <motion.div
                    key={hoveredItem}
                    initial={{ opacity: 0, y: 5, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.92 }}
                    transition={{ duration: 0.1 }}
                    className="absolute -top-[62px] z-[100] px-4 py-1.5 rounded-full bg-slate-950 text-white text-[12px] font-bold tracking-tight whitespace-nowrap shadow-[0_8px_30px_rgb(0,0,0,0.35)] border border-slate-700/80 pointer-events-none flex items-center gap-2"
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-2 ring-white/20"
                      style={{
                        backgroundColor:
                          radialItems.find((i) => i.label === hoveredItem)?.bgColor === 'bg-[#FF3366]'
                            ? '#FF3366'
                            : radialItems.find((i) => i.label === hoveredItem)?.bgColor === 'bg-[#8B5CF6]'
                            ? '#8B5CF6'
                            : radialItems.find((i) => i.label === hoveredItem)?.bgColor === 'bg-[#0284C7]'
                            ? '#0284C7'
                            : radialItems.find((i) => i.label === hoveredItem)?.bgColor === 'bg-[#059669]'
                            ? '#059669'
                            : '#EA580C'
                      }}
                    />
                    <span className="text-white font-bold">{hoveredItem}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {radialItems.map((item, index) => {
                const Icon = item.icon;
                const isItemHovered = hoveredItem === item.label;

                return (
                  <motion.button
                    key={item.id}
                    initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
                    animate={{ 
                      x: item.x, 
                      y: item.y, 
                      scale: isItemHovered ? 1.14 : 1, 
                      opacity: 1 
                    }}
                    exit={{ 
                      x: 0, 
                      y: 0, 
                      scale: 0.2, 
                      opacity: 0 
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 22,
                      mass: 0.8,
                      delay: index * 0.03,
                    }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={item.action}
                    onMouseEnter={() => setHoveredItem(item.label)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onTouchStart={() => setHoveredItem(item.label)}
                    onTouchEnd={() => setTimeout(() => setHoveredItem(null), 1000)}
                    aria-label={item.label}
                    className={`absolute z-50 pointer-events-auto rounded-full flex items-center justify-center text-white border-[3px] border-white shadow-xl ${item.bgColor} ${item.shadowColor} cursor-pointer transition-shadow duration-150 ${
                      isItemHovered ? 'ring-4 ring-white/60 shadow-2xl brightness-110' : ''
                    }`}
                    style={{
                      width: item.size.includes('62px') ? '62px' : item.size.includes('56px') ? '56px' : '52px',
                      height: item.size.includes('62px') ? '62px' : item.size.includes('56px') ? '56px' : '52px',
                    }}
                  >
                    <Icon className={`${item.iconSize} stroke-[2.3] text-white`} />
                  </motion.button>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* BOTTOM NAVIGATION BAR — mobile only, desktop uses TopAppBar tabs */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full z-40 bg-white/98 backdrop-blur-xl border-t border-slate-200 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] flex justify-around items-center h-[72px] px-1 pb-safe">
          {/* 1. Home Tab */}
          <button
            id="nav-home-btn"
            onClick={() => onTabChange('home')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full cursor-pointer active:scale-95 transition-all ${
              activeTab === 'home' ? 'text-teal-700' : 'text-slate-400'
            }`}
          >
            <LayoutGrid className={`w-[24px] h-[24px] ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className={`text-[11px] tracking-tight ${activeTab === 'home' ? 'font-bold' : 'font-medium'}`}>Home</span>
          </button>

          {/* 2. Ledger (Expenses) Tab */}
          <button
            id="nav-expenses-btn"
            onClick={() => onTabChange('expenses')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full cursor-pointer active:scale-95 transition-all ${
              activeTab === 'expenses' ? 'text-teal-700' : 'text-slate-400'
            }`}
          >
            <ReceiptText className={`w-[24px] h-[24px] ${activeTab === 'expenses' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className={`text-[11px] tracking-tight ${activeTab === 'expenses' ? 'font-bold' : 'font-medium'}`}>Ledger</span>
          </button>

          {/* 3. Center FAB */}
          <div className="flex-1 flex justify-center items-center">
            <button
              id="mobile-speed-dial-fab"
              aria-label={isOpen ? 'Close menu' : 'Open quick actions'}
              onClick={() => setIsOpen(!isOpen)}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-[3px] border-white transition-all active:scale-90 cursor-pointer ${
                isOpen ? 'bg-slate-950 shadow-slate-900/40' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/30'
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isOpen ? (
                  <motion.div key="close-icon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X className="w-6 h-6 text-white stroke-[2.6]" />
                  </motion.div>
                ) : (
                  <motion.div key="plus-icon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Plus className="w-6 h-6 text-white stroke-[2.6]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          {/* 4. Chats Tab */}
          <button
            id="nav-chats-btn"
            onClick={() => onTabChange('chats')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full cursor-pointer active:scale-95 transition-all relative ${
              activeTab === 'chats' ? 'text-teal-700' : 'text-slate-400'
            }`}
          >
            <div className="relative">
              <MessageSquare className={`w-[24px] h-[24px] ${activeTab === 'chats' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-teal-600 rounded-full border-2 border-white" />
              )}
            </div>
            <span className={`text-[11px] tracking-tight ${activeTab === 'chats' ? 'font-bold' : 'font-medium'}`}>Chats</span>
          </button>

          {/* 5. Menu Tab */}
          <button
            id="nav-more-btn"
            onClick={() => onTabChange('more')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full cursor-pointer active:scale-95 transition-all ${
              activeTab === 'more' ? 'text-teal-700' : 'text-slate-400'
            }`}
          >
            <Menu className={`w-[24px] h-[24px] ${activeTab === 'more' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className={`text-[11px] tracking-tight ${activeTab === 'more' ? 'font-bold' : 'font-medium'}`}>Menu</span>
          </button>
        </nav>
      </div>
    </>
  );
};
