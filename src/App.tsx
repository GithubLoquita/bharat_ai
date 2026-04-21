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
import { HomeModule } from './pages/HomeModule';
import { ChatModule } from './pages/ChatModule';
import { StudioModule } from './pages/StudioModule';
import { ImageModule } from './pages/ImageModule';
import { SpecializedModule } from './pages/SpecializedModule';

import { Search as SearchIcon, X, History, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ chats: any[], images: any[] }>({ chats: [], images: [] });

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults({ chats: [], images: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const chatQuery = query(collection(db, 'chats'), where('userId', '==', user.uid));
      const imageQuery = query(collection(db, 'images'), where('userId', '==', user.uid));
      
      const [chatSnap, imageSnap] = await Promise.all([
        getDocs(chatQuery),
        getDocs(imageQuery)
      ]);

      const filteredChats = chatSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((c: any) => c.title?.toLowerCase().includes(val.toLowerCase()));

      const filteredImages = imageSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((img: any) => img.prompt?.toLowerCase().includes(val.toLowerCase()));

      setSearchResults({ chats: filteredChats, images: filteredImages });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSearch('');
    };
    window.addEventListener('keydown', handleKeyDown);

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

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubscribe();
    };
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
      case 'home': return <HomeModule onExplore={() => setActiveTab('chat')} />;
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
      <AnimatePresence mode="wait">
        {activeTab !== 'home' && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="flex-1 flex flex-col min-w-0 bg-black relative">
        {activeTab !== 'home' && (
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

            <div className="flex-1 max-w-xl px-12 relative group">
              <div className="absolute left-16 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/40 transition-colors">
                <SearchIcon className="w-4 h-4" />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search chats and memories..."
                className="w-full bg-white/[0.03] border border-white/[0.05] rounded-full py-3.5 pl-12 pr-6 text-[13px] text-white focus:outline-none focus:bg-white/[0.05] focus:border-white/10 transition-all font-medium placeholder:text-white/10"
              />
              {searchQuery && (
                <button 
                  onClick={() => handleSearch('')}
                  className="absolute right-16 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
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
        )}

        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence>
            {searchQuery && (
              <motion.div 
                initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
                exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                className="absolute inset-0 z-50 bg-black/40 p-12 overflow-y-auto"
              >
                <div className="max-w-5xl mx-auto space-y-12">
                  <div className="flex items-center justify-between border-b border-white/5 pb-8">
                    <div>
                      <h2 className="text-3xl font-black tracking-tight text-white">Archives</h2>
                      <p className="text-white/20 text-xs uppercase tracking-[0.2em] font-bold mt-2">Discovery across {user.displayName}'s memory</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">
                        {searchResults.chats.length} Chats
                      </div>
                      <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">
                        {searchResults.images.length} Visuals
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    {/* Chat Results */}
                    <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/20 flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5" /> Conversations
                      </h3>
                      {searchResults.chats.length === 0 ? (
                        <p className="text-white/10 text-xs italic">No matching conversations found.</p>
                      ) : (
                        <div className="space-y-3">
                          {searchResults.chats.map(chat => (
                            <button 
                              key={chat.id}
                              onClick={() => { setActiveTab('chat'); handleSearch(''); }}
                              className="w-full text-left p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[14px] font-medium text-white/80 group-hover:text-white transition-colors">{chat.title}</span>
                                <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/40 transition-all group-hover:translate-x-1" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Image Results */}
                    <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/20 flex items-center gap-2">
                        <ImageIcon className="w-3.5 h-3.5" /> Generated Visuals
                      </h3>
                      {searchResults.images.length === 0 ? (
                        <p className="text-white/10 text-xs italic">No matching visuals found.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {searchResults.images.map(img => (
                            <div 
                              key={img.id}
                              className="group relative aspect-square rounded-2xl overflow-hidden border border-white/5 cursor-pointer"
                              onClick={() => { setActiveTab('images'); handleSearch(''); }}
                            >
                              <img src={img.url} alt="" className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0 group-hover:scale-110" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex items-end">
                                <p className="text-[10px] text-white font-medium line-clamp-2 leading-relaxed">{img.prompt}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
