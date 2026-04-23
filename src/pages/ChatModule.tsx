import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Paperclip, Mic, StopCircle, Trash2, Languages, Globe2, Sparkles, User as UserIcon, Bot, ChevronDown, History, X, MessageSquare } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ai } from '../lib/gemini';
import Markdown from 'react-markdown';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  createdAt: any;
}

interface Chat {
  id: string;
  title: string;
  updatedAt: any;
}

export function ChatModule({ user }: { user: any }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch chats
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat)));
    });
  }, [user]);

  // Fetch messages
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, 'chats', activeChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    });
  }, [activeChatId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const startNewChat = async () => {
    const docRef = await addDoc(collection(db, 'chats'), {
      userId: user.uid,
      title: 'New Conversation',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    setActiveChatId(docRef.id);
  };

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setInputValue(prev => prev + (prev.endsWith(' ') || !prev ? '' : ' ') + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        toast.error("Microphone error. Please check permissions.");
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in your browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        toast.info("Listening...");
      } catch (err) {
        console.error("Failed to start recording:", err);
      }
    }
  };

  const handleSend = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    
    if (isRecording) {
      recognitionRef.current?.stop();
    }
    if (!inputValue.trim() || isStreaming) return;
    
    console.log("[Chat] handleSend triggered"); // Production-safe debug logging
    
    let chatId = activeChatId;
    if (!chatId) {
      const docRef = await addDoc(collection(db, 'chats'), {
        userId: user.uid,
        title: inputValue.slice(0, 30) + '...',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      chatId = docRef.id;
      setActiveChatId(chatId);
    }

    const userMsg = inputValue;
    setInputValue('');
    
    // Add user message to Firestore
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      role: 'user',
      content: userMsg,
      createdAt: serverTimestamp(),
    });

    // Update chat title if it's the first message
    if (messages.length === 0) {
      await updateDoc(doc(db, 'chats', chatId), {
        title: userMsg.slice(0, 40) + (userMsg.length > 40 ? '...' : ''),
        updatedAt: serverTimestamp(),
      });
    }

    setIsStreaming(true);
    
    try {
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }))
      });

      console.log("[Chat] Sending message to Gemini...");
      const result = await chat.sendMessage({ message: userMsg });
      const fullText = result.text || "";

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        role: 'model',
        content: fullText,
        createdAt: serverTimestamp(),
      });
      
      await updateDoc(doc(db, 'chats', chatId), {
        updatedAt: serverTimestamp(),
      });

    } catch (error: any) {
      console.error("[Chat] Error:", error);
      toast.error("AI response failed. Please check your connection.");
    } finally {
      setIsStreaming(false);
    }
  };

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this conversation?")) {
      await deleteDoc(doc(db, 'chats', id));
      if (activeChatId === id) setActiveChatId(null);
    }
  };

  return (
    <div className="flex h-full min-w-0 bg-black relative">
      {/* History Sidebar - Mobile Overlay & Tablet/Desktop Drawer */}
      <AnimatePresence>
        {(historyOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={cn(
              "fixed inset-y-0 left-0 z-40 lg:relative lg:z-0 bg-[#1C1C1E] lg:bg-[#1C1C1E]/30 flex flex-col transition-all overflow-hidden shrink-0 border-r border-white/5",
              !historyOpen && "hidden lg:flex"
            )}
          >
            <div className="p-6 flex items-center justify-between">
              <Button variant="secondary" className="flex-1 justify-start gap-2 h-12 rounded-2xl bg-white/5 border-none hover:bg-white/10" onClick={() => { startNewChat(); setHistoryOpen(false); }}>
                <Plus className="w-4 h-4" /> New Chat
              </Button>
              <button 
                onClick={() => setHistoryOpen(false)}
                className="lg:hidden ml-2 p-2 text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
              {chats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => { setActiveChatId(chat.id); setHistoryOpen(false); }}
                  className={cn(
                    "w-full text-left px-4 py-3.5 rounded-2xl text-sm transition-all group relative cursor-pointer",
                    activeChatId === chat.id ? "bg-white/[0.08] text-white" : "text-white/30 hover:bg-white/[0.03] hover:text-white/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span className="truncate pr-4">{chat.title}</span>
                  </div>
                  <button 
                    onClick={(e) => deleteChat(chat.id, e)}
                    className="absolute right-3 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all p-1 hover:bg-white/5 rounded-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile History Backdrop */}
      {historyOpen && (
        <div 
          onClick={() => setHistoryOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Local Chat Header for Mobile */}
        <div className="lg:hidden h-12 px-6 flex items-center border-b border-white/5 mb-4">
          <button 
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
          >
            <History className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">History</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-8 md:space-y-12 custom-scrollbar" ref={scrollRef}>
          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8"
              >
                <motion.div 
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-24 h-24 bg-white/[0.03] border border-white/10 rounded-[3rem] flex items-center justify-center mb-4 neon-glow"
                >
                  <Sparkles className="w-12 h-12 text-white" />
                </motion.div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black tracking-tighter">Bhart AI</h2>
                  <p className="text-white/40 text-[15px] leading-relaxed max-w-md mx-auto">
                    India's most advanced multimodal assistant. Speak or type in any Indian language.
                  </p>
                </div>
              </motion.div>
            ) : (
              messages.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "flex gap-6 max-w-4xl mx-auto",
                    m.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10",
                    m.role === 'user' ? "bg-white/10 text-white" : "bg-white text-black border-white/20 neon-glow"
                  )}>
                    {m.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className={cn(
                      "rounded-[2.5rem] px-8 py-6 text-[16px] leading-relaxed inline-block max-w-[85%] shadow-sm",
                      m.role === 'user' 
                        ? "bg-white text-[#000000] font-bold float-right rounded-tr-md" 
                        : "bg-white/[0.05] text-white/90 float-left rounded-tl-md markdown-body markdown-body-dark border border-white/[0.05]"
                    )}>
                      <Markdown>{m.content}</Markdown>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
          {isStreaming && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 md:gap-6">
              <div className="w-10 h-10 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center neon-glow">
                <Bot className="w-5 h-5 text-brand animate-pulse" />
              </div>
              <div className="flex-1 glass rounded-3xl px-6 py-4">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-6 md:p-10 bg-gradient-to-t from-black via-black/80 to-transparent">
          <form 
            onSubmit={handleSend}
            className="max-w-3xl mx-auto bg-white/[0.08] backdrop-blur-3xl rounded-[2.5rem] p-2 relative border border-white/[0.05]"
          >
            <div className="flex items-end gap-2 pr-2">
              <div className="flex-1 flex flex-col">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Message Bhart..."
                  className="w-full bg-transparent border-none focus:ring-0 text-[15px] px-5 pt-4 min-h-[56px] max-h-64 resize-none placeholder:text-white/40 text-white"
                />
                <div className="flex items-center gap-1 px-4 pb-3">
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-white/30 hover:text-white hover:bg-white/5 rounded-full">
                    <Plus className="w-5 h-5" />
                  </Button>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "h-9 w-9 transition-colors rounded-full",
                      isRecording ? "text-red-500 bg-red-500/10 animate-pulse" : "text-white/30 hover:text-white hover:bg-white/5"
                    )}
                    onClick={toggleRecording}
                  >
                    {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>
                  <div className="flex-1" />
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                onClick={handleSend}
                disabled={!inputValue.trim() || isStreaming}
                className={cn(
                  "h-10 w-10 md:h-12 md:w-12 rounded-full mb-1 lg:mb-2.5 shadow-xl shadow-white/20 shrink-0 flex items-center justify-center transition-all cursor-pointer z-50",
                  (!inputValue.trim() || isStreaming) ? "opacity-50 grayscale cursor-not-allowed" : "bg-white text-black hover:shadow-white/40 active:bg-white/80 neon-glow"
                )}
              >
                <div className={cn(
                  "rounded-full p-2 flex items-center justify-center transition-transform",
                  isStreaming ? "animate-spin" : "hover:rotate-12"
                )}>
                  <Send className="w-4 h-4 md:w-5 md:h-5 text-black fill-black" />
                </div>
              </motion.button>
            </div>
          </form>
          <p className="text-[10px] text-center mt-3 text-white/20 uppercase tracking-widest font-bold">
            Bhart AI can make mistakes. Verify important info.
          </p>
        </div>
      </div>
    </div>
  );
}
