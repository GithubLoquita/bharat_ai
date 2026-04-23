import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles, Send, BrainCircuit, GraduationCap, Briefcase, Bot, User as UserIcon, HelpCircle } from 'lucide-react';
import { ai as systemAi } from '../lib/gemini';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { useSettings } from '../context/SettingsContext';

interface Personality {
  id: string;
  name: string;
  icon: any;
  systemPrompt: string;
  description: string;
  examples: string[];
}

const personalities: Record<string, Personality> = {
  wellness: {
    id: 'wellness',
    name: 'Mental Health & Psychology',
    icon: BrainCircuit,
    systemPrompt: "You are a compassionate, empathetic AI therapist and wellness coach. You follow ethical guidelines, maintain a supportive tone, and help users navigate stress and productivity. You are not a replacement for clinical help but offer guidance.",
    description: "Your empathetic companion for mental well-being and productivity.",
    examples: ["I am feeling burnt out from work.", "Help me build a morning routine for focus.", "How to deal with social anxiety?"]
  },
  edu: {
    id: 'edu',
    name: 'Education & Homework AI',
    icon: GraduationCap,
    systemPrompt: "You are an expert tutor specializing in competitive exams (JEE, NEET, UPSC) and school curriculum. You explain complex topics simply, provide MCQs, and generate study notes. You are helpful and academic.",
    description: "Personalized tutoring and exam preparation assistant.",
    examples: ["Explain Quantum Entanglement simply.", "Give me 5 MCQs on Ancient Indian History.", "How to prepare for UPSC Mains?"]
  },
  business: {
    id: 'business',
    name: 'Business & Startup AI',
    icon: Briefcase,
    systemPrompt: "You are a strategic business consultant and marketing expert. You help with startup validation, resume building, sales emails, and market copy. You are professional and result-oriented.",
    description: "Launch and scale your ideas with enterprise-grade strategy.",
    examples: ["Validate a SaaS idea for Indian agriculture.", "Write a high-converting sales email for a CRM.", "Give me feedback on my executive summary."]
  }
};

export function SpecializedModule({ type }: { type: string }) {
  const { keys } = useSettings();
  const p = personalities[type] || personalities.wellness;
  const [messages, setMessages] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Dynamic AI instance
  const ai = useMemo(() => {
    if (keys.gemini) {
      return new GoogleGenAI({ apiKey: keys.gemini });
    }
    return systemAi;
  }, [keys.gemini]);


  useEffect(() => {
    setMessages([]);
  }, [type]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isBusy) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsBusy(true);

    try {
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: { systemInstruction: p.systemPrompt },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }))
      });

      const response = await chat.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', content: response.text || '' }]);
    } catch (error) {
      toast.error("Process interrupted. Try again.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black p-8 overflow-hidden">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col min-h-0">
        <div className="mb-10 flex items-center gap-6">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center neon-glow">
            <p.icon className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">{p.name}</h1>
            <p className="text-white/30 text-[15px] leading-relaxed">{p.description}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-8 pr-4 mb-6 custom-scrollbar" ref={scrollRef}>
          {messages.length === 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {p.examples.map(ex => (
                    <button 
                      key={ex} 
                      onClick={() => setInput(ex)}
                      className="bg-white/[0.03] border border-white/[0.05] p-8 rounded-[2.5rem] text-[15px] text-white/40 text-left hover:bg-white/[0.06] transition-all hover:border-white/[0.1] flex items-center justify-between group shadow-sm"
                    >
                      {ex}
                      <Sparkles className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                ))}
             </div>
          )}
          
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-5", m.role === 'user' ? "flex-row-reverse" : "flex-row")}
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-white/[0.05] shadow-lg",
                m.role === 'user' ? "bg-white/10 text-white" : "bg-white text-black border-white/20 neon-glow"
              )}>
                {m.role === 'user' ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={cn(
                "flex-1 rounded-[2rem] px-8 py-5 text-[15px] leading-relaxed markdown-body shadow-sm max-w-[85%]",
                m.role === 'user' 
                  ? "bg-white text-[#000000] font-bold float-right rounded-tr-md" 
                  : "bg-white/[0.08] text-white/90 float-left rounded-tl-md markdown-body-dark"
              )}>
                <Markdown>{m.content}</Markdown>
              </div>
            </motion.div>
          ))}
          {isBusy && (
             <div className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-brand/10" />
                <div className="flex-1 glass h-12 rounded-3xl" />
             </div>
          )}
        </div>

        <div className="bg-white/[0.08] backdrop-blur-3xl border border-white/[0.05] p-2.5 rounded-full flex items-center gap-3 shadow-2xl">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Message ${p.name.split(' ')[0]}...`}
            className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] px-8 py-3.5 placeholder:text-white/40 text-white"
          />
          <Button 
            variant="neon" 
            size="icon" 
            className="h-11 w-11 rounded-full shadow-lg shadow-white/20"
            onClick={handleSend}
            disabled={!input.trim() || isBusy}
          >
            <div className="bg-white rounded-full p-1.5 shadow-sm">
              <Send className="w-4 h-4 text-black fill-black" />
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
