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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Sync user to Firestore
        const userRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: 'free',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (e) {
          console.error("Firebase Auth Sync error:", e);
        }
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success("Welcome to Bhart AI");
    } catch (error) {
      toast.error("Login failed");
    }
  };

  const handleLogout = async () => {
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

  if (!user) {
    return (
      <div className="min-h-screen bg-black overflow-hidden relative selection:bg-white selection:text-black">
        <Toaster position="top-center" theme="dark" />
        
        {/* Fine-tuned Background Accents */}
        <div className="absolute top-0 left-1/4 w-1/2 h-full bg-gradient-to-b from-white/[0.03] to-transparent blur-[120px]" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/[0.04] blur-[150px] rounded-full" />

        <nav className="p-8 flex justify-between items-center relative z-10 container mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter text-white">Bhart AI</span>
          </div>
          <div className="flex items-center gap-8">
            <button onClick={handleLogin} className="text-xs font-bold text-white/40 hover:text-white transition-colors tracking-widest uppercase">Pricing</button>
            <button onClick={handleLogin} className="text-xs font-bold text-white/40 hover:text-white transition-colors tracking-widest uppercase">Developers</button>
            <Button variant="outline" onClick={handleLogin} className="rounded-full px-8 border-white/10 hover:bg-white hover:text-black transition-all">Sign In</Button>
          </div>
        </nav>

        <main className="container mx-auto px-6 py-32 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-full text-[10px] font-black tracking-[0.2em] text-white/60 mb-12 uppercase"
          >
            <Sparkles className="w-3 h-3 text-white" />
            Google AI Studio Powering Bharat
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-7xl md:text-[10rem] font-black tracking-[-0.05em] mb-12 max-w-6xl leading-[0.85] text-white"
          >
            AI FOR THE <br /> <span className="opacity-40">NEXT BILLION.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-white/40 text-lg md:text-2xl max-w-2xl mb-16 leading-relaxed font-medium"
          >
            Supercharge your workflow with India's most advanced <br className="hidden md:block" /> multimodal intelligence platform. 
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col md:flex-row gap-6"
          >
            <Button size="lg" variant="neon" onClick={handleLogin} className="gap-3 h-16 px-12 rounded-full font-black tracking-widest shadow-2xl shadow-white/10 group">
              Get Started <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="secondary" className="h-16 px-12 rounded-full font-black tracking-widest bg-white/5 border-white/10">Read Docs</Button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full max-w-5xl">
            {[
              { icon: Globe, title: "12+ Indian Languages", desc: "Native support for Hindi, Bengali, Tamil, Santali, and more." },
              { icon: Shield, title: "Privacy First", desc: "Enterprise-grade security and encrypted conversations." },
              { icon: Zap, title: "Blazing Fast", desc: "Powered by Gemini 1.5 Flash for near-instant responses." },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="glass p-8 rounded-3xl text-left"
              >
                <feature.icon className="w-10 h-10 text-brand mb-4" />
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </main>
        
        <footer className="mt-40 border-t border-white/5 p-12 text-center text-white/30 text-sm">
          &copy; 2026 Bhart AI Platform. Built with Pride in India.
        </footer>
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
            <div className="flex items-center gap-3 bg-white/[0.05] border border-white/[0.08] rounded-full px-4 py-2 hover:bg-white/[0.08] transition-colors cursor-pointer group">
              <img src={user.photoURL || ''} alt="" className="w-7 h-7 rounded-full border border-white/10" />
              <div className="text-sm">
                <p className="font-semibold leading-tight text-white/90">{user.displayName}</p>
              </div>
              <button onClick={handleLogout} className="ml-2 text-white/20 group-hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
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
