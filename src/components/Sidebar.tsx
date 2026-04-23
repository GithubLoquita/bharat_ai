import { type LucideIcon, MessageSquare, LayoutGrid, Image as ImageIcon, BrainCircuit, GraduationCap, Briefcase, Zap, Settings, History, Sparkles, Home, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  category?: string;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
  { id: 'studio', label: 'AI Studio', icon: Sparkles },
  { id: 'images', label: 'Vision Forge', icon: ImageIcon },
  { id: 'wellness', label: 'Psychology', icon: BrainCircuit },
  { id: 'edu', label: 'Education', icon: GraduationCap },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'about', label: 'About', icon: Globe },
  { id: 'careers', label: 'Careers', icon: Briefcase },
];

interface SidebarProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onClose?: () => void;
}

export function Sidebar({ user, activeTab, setActiveTab, onClose }: SidebarProps) {
  return (
    <aside className={cn(
      "w-72 flex flex-col bg-black h-full overflow-hidden border-r border-white/[0.05] relative",
      "lg:sticky lg:top-0 h-screen"
    )}>
      <div className="p-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
            <img 
              src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} 
              alt={user?.displayName} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-tighter text-white truncate leading-tight">
              {user?.displayName?.split(' ')[0] || 'Explorer'}
            </h1>
            <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em]">
              {user?.isGuest ? 'Guest Entry' : 'Level 1 Sync'}
            </p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-white/40 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar pt-2">
        {navItems.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => {
              setActiveTab(item.id);
              onClose?.();
            }}
            className={cn(
              "w-full flex items-center gap-4 px-6 py-4 rounded-full text-[15px] transition-all group relative overflow-hidden",
              activeTab === item.id 
                ? "text-black font-bold" 
                : "text-white/40 hover:text-white/80"
            )}
          >
            {activeTab === item.id && (
              <motion.div 
                layoutId="nav-pill"
                className="absolute inset-0 bg-white"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <item.icon className={cn(
              "w-5 h-5 transition-colors relative z-10",
              activeTab === item.id ? "text-black" : "text-white/30 group-hover:text-white/60"
            )} />
            <span className="relative z-10">{item.label}</span>
          </motion.button>
        ))}
      </nav>
      
      <div className="p-6 space-y-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/[0.03] border border-white/5 p-6 rounded-[2rem] text-center"
        >
          <Sparkles className="w-5 h-5 text-white/20 mx-auto mb-3" />
          <p className="text-[10px] text-white/20 font-black tracking-[0.3em] uppercase">Public Alpha</p>
        </motion.div>

        <div className="px-4 text-center">
          <p className="text-[10px] text-white/10 font-bold tracking-tight">Built by Sandip Hembram</p>
          <p className="text-[8px] text-white/[0.05] uppercase tracking-widest mt-0.5">CEO & Co-founder</p>
        </div>
      </div>
    </aside>
  );
}
