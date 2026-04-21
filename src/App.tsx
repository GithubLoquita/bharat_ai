import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Button } from './components/ui/Button';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, type User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, User as UserIcon, LogOut, ChevronRight, Sparkles, Globe, Shield } from 'lucide-react';

// Modules
import { ChatModule } from './pages/ChatModule';
import { StudioModule } from './pages/StudioModule';
import { ImageModule } from './pages/ImageModule';
import { SpecializedModule } from './pages/SpecializedModule';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    // Generate or retrieve a persistent guest identity
    let guestId = localStorage.getItem('bhart_guest_id');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('bhart_guest_id', guestId);
    }

    const guestUser = {
      uid: guestId,
      displayName: 'Guest Explorer',
      email: 'explorer@bhart.ai',
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestId}`,
      isGuest: true
    };

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
      } else {
        setUser(guestUser);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    if (user?.isGuest) {
      toast.info("Guest session remains active");
      return;
    }
    await signOut(auth);
    toast.info("Logged out successfully");
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-6">
        <motion.div 
          animate={{ 
            rotate: 360,
            borderRadius: ["20%", "50%", "20%"]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-2 border-white/20 border-t-white"
        />
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white/40 text-xs tracking-[0.3em] font-black uppercase"
        >
          Initializing Bhart AI
        </motion.p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'chat': return <ChatModule user={user} />;
      case 'studio': return <StudioModule user={user} />;
      case 'images': return <ImageModule user={user} />;
      case 'wellness':
      case 'edu':
      case 'business':
        return <SpecializedModule type={activeTab} />;
      default: return (
        <div className="flex flex-col items-center justify-center h-full text-white/40 space-y-6">
          <Sparkles className="w-16 h-16 animate-pulse" />
          <p className="text-xs font-black uppercase tracking-[0.4em] text-white/10">In Development: {activeTab}</p>
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans">
      <Toaster position="bottom-right" theme="dark" />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col min-w-0 bg-black relative">
        <header className="h-24 px-10 flex items-center justify-between border-b border-white/[0.05] sticky top-0 z-20 bg-black/60 backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-white tracking-tighter capitalize transition-all">{activeTab}</h2>
            {activeTab === 'chat' && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-3 py-1 bg-white/[0.05] border border-white/[0.1] rounded-full text-[10px] font-black tracking-widest text-white/40"
              >
                1.5 FLASH
              </motion.span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/[0.05] border border-white/[0.08] rounded-full px-4 py-2 transition-colors group">
              <img src={user.photoURL || ''} alt="" className="w-7 h-7 rounded-full border border-white/10" />
              <div className="text-sm">
                <p className="font-semibold leading-tight text-white/90">{user.displayName}</p>
              </div>
              {!user.isGuest && (
                <button onClick={handleLogout} className="ml-2 text-white/20 group-hover:text-red-400 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

const Zap = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m13 2-2 10h3L12 22l2-10h-3l2-10z"/></svg>;
