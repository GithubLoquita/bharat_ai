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
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 bg-brand rounded-2xl neon-glow"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black overflow-hidden relative">
        <Toaster position="top-center" theme="dark" />
        
        {/* Background Accents */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />

        <nav className="p-6 flex justify-between items-center relative z-10 container mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <Zap className="text-white w-5 h-5 fill-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Bhart AI</span>
          </div>
          <Button variant="outline" onClick={handleLogin}>Log In</Button>
        </nav>

        <main className="container mx-auto px-6 py-20 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 glass-pill text-xs font-semibold text-brand mb-8"
          >
            <Sparkles className="w-3 h-3" />
            INDIA'S PREMIER AI PLATFORM
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 max-w-4xl leading-[1]"
          >
            Empower Bharat with <span className="text-brand">Next-Gen</span> Artificial Intelligence.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed"
          >
            The all-in-one AI ecosystem for Bharat. From multilingual chat to image generation, 
            psychology support to educational assistance. Built for efficiency, accessibility, and local context.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row gap-4"
          >
            <Button size="lg" variant="neon" onClick={handleLogin} className="gap-2">
              Start Building <ChevronRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="secondary">View Documentation</Button>
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
        <div className="flex flex-col items-center justify-center h-full text-white/40 space-y-4">
          <Zap className="w-12 h-12" />
          <p className="text-sm font-medium uppercase tracking-widest text-white/20">Coming Soon: {activeTab}</p>
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans">
      <Toaster position="bottom-right" theme="dark" />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col min-w-0 bg-black relative">
        <header className="h-20 px-10 flex items-center justify-between bg-black/40 backdrop-blur-3xl sticky top-0 z-20">
          <h2 className="text-xl font-bold text-white tracking-tight capitalize">{activeTab}</h2>
          
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
