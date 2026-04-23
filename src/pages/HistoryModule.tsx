import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History as HistoryIcon, MessageSquare, Image as ImageIcon, Search, Trash2, Clock, ChevronRight } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export function HistoryModule({ user }: { user: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'chat' | 'images'>('all');

  useEffect(() => {
    fetchHistory();
  }, [user, filter]);

  const fetchHistory = async () => {
    if (!user || !auth.currentUser) {
      setLoading(false);
      if (!user) setItems([]);
      return;
    }
    setLoading(true);
    try {
      let allItems: any[] = [];
      
      if (filter === 'all' || filter === 'chat') {
        const chatQ = query(collection(db, 'chats'), where('userId', '==', user.uid), orderBy('updatedAt', 'desc'));
        const chatSnap = await getDocs(chatQ);
        allItems = [...allItems, ...chatSnap.docs.map(d => ({ id: d.id, type: 'chat', ...d.data() }))];
      }

      if (filter === 'all' || filter === 'images') {
        const imgQ = query(collection(db, 'images'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        const imgSnap = await getDocs(imgQ);
        allItems = [...allItems, ...imgSnap.docs.map(d => ({ id: d.id, type: 'image', ...d.data() }))];
      }

      allItems.sort((a, b) => {
        const timeA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setItems(allItems);
    } catch (error: any) {
      console.warn("History fetch permission denied:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    try {
      await deleteDoc(doc(db, type === 'chat' ? 'chats' : 'images', id));
      setItems(prev => prev.filter(item => item.id !== id));
      toast.success("Item removed from history");
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-black p-6 md:p-12 lg:p-20 custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center text-white/40">
              <HistoryIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white capitalize">Activity Store</h1>
              <p className="text-white/40 font-medium">Your creative and investigative journey through Bhart AI.</p>
            </div>
          </div>

          <div className="flex bg-white/[0.03] border border-white/10 p-1.5 rounded-full">
            {(['all', 'chat', 'images'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                  filter === f ? "bg-white text-black" : "text-white/20 hover:text-white/40"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="grid gap-4">
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-24 w-full bg-white/[0.02] animate-pulse rounded-3xl" />
            ))
          ) : items.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <Search className="w-12 h-12 text-white/5 mx-auto" />
              <p className="text-white/20 font-bold uppercase tracking-widest text-[10px]">No activity found in this category</p>
            </div>
          ) : (
            items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative flex items-center justify-between p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all overflow-hidden"
              >
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center text-white/20 group-hover:text-white/60 transition-colors capitalize">
                    {item.type === 'chat' ? <MessageSquare className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-white group-hover:text-white/90 line-clamp-1">
                      {item.title || item.prompt || "Untitled Collaboration"}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{item.type}</span>
                      <span className="w-1 h-1 rounded-full bg-white/5" />
                      <div className="flex items-center gap-1.5 text-white/20">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-medium tracking-tight">
                          {item.updatedAt?.seconds 
                            ? format(new Date(item.updatedAt.seconds * 1000), 'MMM d, h:mm a')
                            : item.createdAt?.seconds 
                              ? format(new Date(item.createdAt.seconds * 1000), 'MMM d, h:mm a')
                              : 'Recent'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(item.id, item.type)}
                    className="w-10 h-10 rounded-xl border-white/5 hover:bg-red-500/10 hover:border-red-500/20 text-white/20 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
