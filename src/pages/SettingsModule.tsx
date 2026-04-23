import { motion } from 'framer-motion';
import { User, Shield, Bell, Zap, LogOut, ChevronRight, Moon, Globe, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface SettingsModuleProps {
  user: any;
  onLogout: () => void;
}

export function SettingsModule({ user, onLogout }: SettingsModuleProps) {
  const sections = [
    {
      title: "Account",
      items: [
        { 
          id: 'profile', 
          label: 'Profile Information', 
          icon: User, 
          value: user?.displayName || 'Guest Explorer',
          desc: user?.email || 'Sign in to sync your history'
        },
        { 
          id: 'security', 
          label: 'Security & Privacy', 
          icon: Shield, 
          desc: 'Manage your data and account safety'
        }
      ]
    },
    {
      title: "AI Preferences",
      items: [
        { 
          id: 'model', 
          label: 'Response Quality', 
          icon: Zap, 
          value: 'Balanced',
          desc: 'Gemini 3 Flash (Optimized for speed)'
        },
        { 
          id: 'tone', 
          label: 'AI Personality', 
          icon: MessageSquare, 
          value: 'Technical',
          desc: 'Concise and software-focused'
        }
      ]
    },
    {
      title: "App Settings",
      items: [
        { 
          id: 'theme', 
          label: 'Appearance', 
          icon: Moon, 
          value: 'OLED Black',
          desc: 'Optimized for high-contrast displays'
        },
        { 
          id: 'lang', 
          label: 'System Language', 
          icon: Globe, 
          value: 'English (US)',
          desc: 'Default interface language'
        }
      ]
    }
  ];

  const handleAction = (id: string) => {
    switch (id) {
      case 'profile':
        toast.info("Profile editing coming soon");
        break;
      default:
        toast.info(`${id} settings are pre-configured for stability`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-black p-6 md:p-12 lg:p-20 custom-scrollbar">
      <div className="max-w-3xl mx-auto space-y-16">
        {/* Header */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 bg-white/[0.03] border border-white/10 rounded-[2rem] flex items-center justify-center"
          >
            <Shield className="w-6 h-6 text-white" />
          </motion.div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-white capitalize">Settings</h1>
            <p className="text-white/40 font-medium">Manage your Bhart AI experience and preferences.</p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 px-4">
                {section.title}
              </h2>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ x: 8 }}
                    onClick={() => handleAction(item.id)}
                    className="w-full group flex items-center gap-6 p-4 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] group-hover:bg-white/[0.06] flex items-center justify-center transition-colors">
                      <item.icon className="w-5 h-5 text-white/40 group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[15px] font-bold text-white/80 group-hover:text-white">{item.label}</span>
                        {item.value && (
                          <span className="text-[13px] font-bold text-white/20 px-3 py-1 rounded-full bg-white/[0.03]">
                            {item.value}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/30 group-hover:text-white/50">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/40" />
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Danger Zone / Logout */}
        <div className="pt-8 border-t border-white/5">
          <Button 
            variant="outline" 
            onClick={onLogout}
            className="w-full h-16 rounded-[2rem] border-red-500/10 hover:bg-red-500/5 hover:border-red-500/20 text-red-500 font-black tracking-widest uppercase text-xs"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {user?.isGuest ? 'End Guest Session' : 'Sign Out Account'}
          </Button>
          <div className="mt-8 text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="w-4 h-4 text-white/10" />
              <span className="text-white/10 text-[10px] uppercase font-black tracking-[0.2em]">Bhart AI v1.0.4-alpha</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
