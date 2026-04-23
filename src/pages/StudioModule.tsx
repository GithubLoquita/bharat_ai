import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Save, Trash2, Database, Sliders, Code2, Sparkles, Terminal, Copy, Check } from 'lucide-react';
import { ai as systemAi } from '../lib/gemini';
import { GoogleGenAI } from "@google/genai";
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import Markdown from 'react-markdown';
import { useSettings } from '../context/SettingsContext';

export function StudioModule({ user }: { user: any }) {
  const { keys } = useSettings();
  const [systemPrompt, setSystemPrompt] = useState('You are Bhart AI, an expert software architect and assistant. Be concise, technical, and helpful.');
  const [userPrompt, setUserPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Dynamic AI instance
  const ai = useMemo(() => {
    if (keys.gemini) {
      return new GoogleGenAI({ apiKey: keys.gemini });
    }
    return systemAi;
  }, [keys.gemini]);


  const runTest = async () => {
    if (!userPrompt.trim() || isExecuting) return;
    
    setIsExecuting(true);
    const toastId = toast.loading("Executing playground test...");
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: temperature,
          maxOutputTokens: maxTokens,
        }
      });

      setOutput(response.text || '');
      toast.success("Execution complete", { id: toastId });
    } catch (error) {
      toast.error("Playground execution failed", { id: toastId });
    } finally {
      setIsExecuting(false);
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.info("Copied to clipboard");
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-black">
      {/* Configuration Sidebar */}
      <div className="w-full md:w-80 border-r border-white/5 p-8 flex flex-col space-y-10 overflow-y-auto shrink-0 bg-white/[0.02]">
        <div className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/20 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-white" /> PARAMETERS
          </h2>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-semibold text-white/40">Temperature</label>
              <span className="text-[11px] font-mono text-white bg-white/10 px-2.5 py-1 rounded-lg">{temperature}</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.1" 
              value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-white h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-white/20 uppercase font-bold tracking-widest">
              <span>Predictable</span>
              <span>Creative</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-semibold text-white/40">Max Tokens</label>
              <span className="text-[11px] font-mono text-white bg-white/10 px-2.5 py-1 rounded-lg">{maxTokens}</span>
            </div>
            <input 
              type="range" min="128" max="8192" step="128" 
              value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full accent-white h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-4 pt-6 border-t border-white/[0.05]">
            <label className="text-xs font-semibold text-white/40 block px-1">Developer Mode</label>
            <div className="bg-white/[0.03] border border-white/[0.05] p-4 rounded-2xl flex items-center justify-between">
              <span className="text-[11px] text-white/20 font-bold tracking-widest">ENFORCE SCHEMA</span>
              <div className="w-10 h-6 bg-white/10 rounded-full relative">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white/20 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1" />
        
        <Button variant="outline" className="w-full h-12 rounded-2xl border-dashed border-white/10 hover:border-brand/40 text-xs font-bold uppercase tracking-widest">
          <Save className="w-4 h-4 mr-2" /> Save Template
        </Button>
      </div>

      {/* Main Playground */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex flex-col p-8 space-y-8 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/20 flex items-center gap-2">
              <Terminal className="w-4 h-4" /> SYSTEM INSTRUCTION
            </h3>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-36 bg-white/[0.03] border border-white/[0.05] rounded-[2rem] p-6 text-[13px] font-mono focus:ring-1 focus:ring-brand focus:border-brand resize-none placeholder:text-white/10 transition-all"
              placeholder="Tell the model how to behave..."
            />
          </div>

          <div className="space-y-4 flex-1 flex flex-col">
            <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/20 flex items-center gap-2">
              <Code2 className="w-4 h-4" /> USER INPUT
            </h3>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              className="w-full flex-1 bg-white/[0.03] border border-white/[0.05] rounded-[2.5rem] p-8 text-[15px] focus:ring-1 focus:ring-brand focus:border-brand resize-none placeholder:text-white/10 transition-all shadow-inner"
              placeholder="Enter your prompt here..."
            />
          </div>

          <div className="flex items-center gap-4">
             <Button 
              variant="neon" 
              className="flex-1 h-14 rounded-full text-base font-bold gap-3 shadow-2xl shadow-brand/20"
              onClick={runTest}
              disabled={isExecuting}
            >
              <Play className={cn("w-5 h-5", isExecuting && "animate-pulse")} />
              {isExecuting ? "EXECUTING..." : "RUN INFERENCE"}
            </Button>
            <Button variant="secondary" className="h-14 w-14 rounded-full bg-white/5 border-none hover:bg-white/10" onClick={() => setUserPrompt('')}>
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Output Panel */}
        <div className={cn(
          "h-1/3 border-t border-white/[0.05] bg-black p-8 overflow-hidden flex flex-col transition-all",
          !output && "h-20"
        )}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/20 flex items-center gap-2">
              <Database className="w-4 h-4" /> GENERATED RESPONSE
            </h3>
            {output && (
              <button 
                onClick={copyOutput}
                className="text-white/20 hover:text-brand transition-colors flex items-center gap-2"
              >
                {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="text-[11px] font-bold uppercase tracking-widest">COPY</span>
              </button>
            )}
          </div>
          
          {output ? (
            <div className="flex-1 overflow-y-auto bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-8 markdown-body font-mono text-[14px]">
              <Markdown>{output}</Markdown>
            </div>
          ) : (
             <p className="text-[10px] text-white/10 uppercase tracking-[0.3em] font-bold text-center mt-2">IDLE ENGINE</p>
          )}
        </div>
      </div>
    </div>
  );
}
