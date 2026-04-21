import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Paperclip, Mic, StopCircle, Trash2, Languages, Globe2, Sparkles, User as UserIcon, Bot, ChevronDown } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth } from '../lib/firebase';
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

  const handleSend = async () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    }
    if (!inputValue.trim() || isStreaming) return;
    
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

      const response = await chat.sendMessageStream({ message: userMsg });
      let fullText = '';
      
      // We don't save every chunk to DB (too many writes), 
      // we add one placeholder record and update it at the end 
      // or simply add the final text to DB.
      // For best UX in this environment, we'll collect the stream and then write once.
      
      for await (const chunk of response) {
        fullText += (chunk as any).text;
      }

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        role: 'model',
        content: fullText,
        createdAt: serverTimestamp(),
      });
      
      await updateDoc(doc(db, 'chats', chatId), {
        updatedAt: serverTimestamp(),
      });

    } catch (error) {
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
      {/* History Sidebar */}
      <div className={cn(
        "w-72 bg-[#1C1C1E]/30 flex flex-col transition-all overflow-hidden shrink-0",
      )}>
        <div className="p-6">
          <Button variant="secondary" className="w-full justify-start gap-2 h-12 rounded-2xl bg-white/5 border-none hover:bg-white/10" onClick={startNewChat}>
            <Plus className="w-4 h-4" /> New Chat
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 space-y-1">
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
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
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6">
              <div className="w-20 h-20 bg-brand/10 border border-brand/20 rounded-[2.5rem] flex items-center justify-center rotate-3 scale-110 mb-4 neon-glow">
                <Sparkles className="w-10 h-10 text-brand" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Namaste! I am Bhart.</h2>
              <p className="text-white/40 text-sm leading-relaxed">
                I can help you with coding, creative writing, multilingual translation, or just a friendly conversation. 
                I speak Hindi, Bengali, Tamil, and many more Indian languages.
              </p>
              
              <div className="grid grid-cols-2 gap-3 w-full mt-8">
                {[
                  "Write a poem in Hindi about a sunrise.",
                  "Explain photosynthesis in simple Bengali.",
                  "How to make a great Masala Chai?",
                  "Write a React component for a job dashboard.",
                ].map(txt => (
                  <button 
                    key={txt} 
                    onClick={() => { setInputValue(txt); }}
                    className="glass p-4 rounded-2xl text-xs text-white/50 text-left hover:bg-white/5 transition-all hover:border-white/10"
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4 md:gap-6",
                  m.role === 'user' ? "flex-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10",
                  m.role === 'user' ? "bg-white/5 text-white/70" : "bg-brand/10 text-brand border-brand/20 neon-glow"
                )}>
                  {m.role === 'user' ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className={cn(
                    "rounded-[2rem] px-6 py-4 text-[15px] leading-relaxed inline-block max-w-[85%]",
                    m.role === 'user' ? "bg-brand text-white font-medium float-right rounded-tr-md" : "bg-white/[0.08] text-white/90 float-left rounded-tl-md markdown-body shadow-sm"
                  )}>
                    <Markdown>{m.content}</Markdown>
                  </div>
                </div>
              </motion.div>
            ))
          )}
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
          <div className="max-w-3xl mx-auto bg-white/[0.08] backdrop-blur-3xl rounded-[2.5rem] p-2 relative border border-white/[0.05]">
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
                  className="w-full bg-transparent border-none focus:ring-0 text-[15px] px-5 pt-4 min-h-[56px] max-h-64 resize-none placeholder:text-white/20"
                />
                <div className="flex items-center gap-1.5 px-4 pb-3">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-white/30 hover:text-white hover:bg-white/5 rounded-full">
                    <Plus className="w-5 h-5" />
                  </Button>
                  <Button 
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
              <Button 
                variant="neon" 
                size="icon" 
                className="h-10 w-10 rounded-full mb-2.5 shadow-xl shadow-brand/20" 
                onClick={handleSend}
                disabled={!inputValue.trim() || isStreaming}
              >
                <div className="bg-white rounded-full p-1.5">
                  <Send className="w-4 h-4 text-brand fill-brand" />
                </div>
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-center mt-3 text-white/20 uppercase tracking-widest font-bold">
            Bhart AI can make mistakes. Verify important info.
          </p>
        </div>
      </div>
    </div>
  );
}

const MessageSquare = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
