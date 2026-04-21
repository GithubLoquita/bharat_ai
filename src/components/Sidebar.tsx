import { type LucideIcon, MessageSquare, LayoutGrid, Image as ImageIcon, BrainCircuit, GraduationCap, Briefcase, Zap, Settings, History, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  category?: string;
}

const navItems: NavItem[] = [
  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
  { id: 'studio', label: 'AI Studio', icon: Sparkles },
  { id: 'images', label: 'Vision Forge', icon: ImageIcon },
  { id: 'wellness', label: 'Psychology', icon: BrainCircuit },
  { id: 'edu', label: 'Education', icon: GraduationCap },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside className="w-72 flex flex-col bg-black h-screen sticky top-0 overflow-hidden border-r border-white/[0.05]">
      <div className="p-10">
        <h1 className="text-2xl font-black tracking-tighter text-white">Bhart AI</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar pt-2">
        {navItems.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setActiveTab(item.id)}
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
      
      <div className="p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/[0.05] border border-white/[0.08] p-6 rounded-[2rem] relative overflow-hidden group shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl rounded-full" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-black mb-2 flex items-center gap-2">
            PRO ACCESS
          </p>
          <p className="text-xs text-white/60 mb-4 leading-relaxed">Unlock deep reasoning and multimodal analysis.</p>
          <button className="w-full py-3 bg-white text-black rounded-full text-xs font-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/10 uppercase tracking-widest">
            Upgrade Now
          </button>
        </motion.div>
      </div>
    </aside>
  );
}
