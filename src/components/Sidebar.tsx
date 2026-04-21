import { type LucideIcon, MessageSquare, LayoutGrid, Image as ImageIcon, BrainCircuit, GraduationCap, Briefcase, Zap, Settings, History } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  category?: string;
}

const navItems: NavItem[] = [
  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
  { id: 'studio', label: 'AI Studio', icon: Zap },
  { id: 'images', label: 'Image Gen', icon: ImageIcon },
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
    <aside className="w-64 flex flex-col bg-black h-screen sticky top-0 overflow-hidden">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center neon-glow">
            <Zap className="text-white w-5 h-5 fill-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Bhart AI</h1>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all group relative",
              activeTab === item.id 
                ? "bg-white/[0.08] text-white font-medium" 
                : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              activeTab === item.id ? "text-brand" : "text-white/30 group-hover:text-white/50"
            )} />
            {item.label}
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-white/10">
        <div className="glass p-4 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Upgrade to Pro</p>
          <p className="text-xs text-white/70 mb-3">Get access to premium models and unlimited features.</p>
          <button className="w-full py-2 bg-brand text-white rounded-lg text-xs font-bold hover:bg-brand/90 transition-all shadow-lg shadow-brand/20">
            India Pro ₹499
          </button>
        </div>
      </div>
    </aside>
  );
}
