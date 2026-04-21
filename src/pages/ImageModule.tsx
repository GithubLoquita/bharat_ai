import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, Wand2, Download, Trash2, LayoutGrid, Search, Sparkles, AlertCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ai } from '../lib/gemini';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  createdAt: any;
}

export function ImageModule({ user }: { user: any }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [aspectRatio, setAspectRatio] = useState('1:1');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'images'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setImages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GeneratedImage)));
    });
  }, [user]);

  const generateImage = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    const toastId = toast.loading("Invoking creative models...");
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          }
        }
      });

      let imageUrl = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!imageUrl) {
        const safetyMessage = response.candidates?.[0]?.finishReason === 'SAFETY' 
          ? "Request blocked for safety reasons." 
          : "The model didn't return an image. Try another prompt.";
        throw new Error(safetyMessage);
      }

      await addDoc(collection(db, 'images'), {
        userId: user.uid,
        prompt: prompt,
        url: imageUrl,
        createdAt: serverTimestamp(),
      });

      toast.success("Image generated successfully!", { id: toastId });
      setPrompt('');
    } catch (error: any) {
      console.error("Image Generation Error:", error);
      const msg = error?.message?.includes("safety") 
        ? "Blocked by safety filters. Please try a different prompt."
        : "Generation failed. This model might require a personal API key in Settings.";
      toast.error(msg, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteImage = async (id: string) => {
    if (confirm("Delete this artwork?")) {
      await deleteDoc(doc(db, 'images', id));
      toast.info("Deleted");
    }
  };

  return (
    <div className="h-full flex flex-col p-8 space-y-10 bg-black overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div className="space-y-3 px-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Vision Forge</h1>
          <p className="text-white/30 text-sm md:text-[15px] leading-relaxed max-w-2xl">Convert your thoughts into high-fidelity visuals using India's most advanced generative infrastructure.</p>
        </div>

        <div className="bg-white/[0.04] backdrop-blur-3xl p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] space-y-6 md:space-y-8 border border-white/[0.06]">
          <div className="space-y-4">
            <label className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-bold text-white/20 ml-2">THE CONCEPT</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic cyber-shrine in the heart of Varanasi, 8k, cinematic lighting..."
              className="w-full bg-white/[0.05] border border-white/[0.05] rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 text-sm md:text-[15px] focus:ring-1 focus:ring-brand/50 focus:border-brand/50 min-h-[120px] md:min-h-[140px] resize-none transition-all placeholder:text-white/10"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 md:gap-8">
            <div className="space-y-3">
              <span className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-bold text-white/20 block ml-2">DIMENSIONS</span>
              <div className="flex flex-wrap gap-2 p-1.5 bg-black/40 rounded-3xl md:rounded-full border border-white/[0.05] w-fit">
                {['1:1', '16:9', '9:16', '4:3'].map(ratio => (
                  <button 
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={cn(
                      "px-4 md:px-5 py-1.5 rounded-full text-[10px] md:text-[11px] font-bold transition-all",
                      aspectRatio === ratio ? "bg-brand text-white shadow-xl shadow-brand/20" : "text-white/30 hover:text-white/50"
                    )}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="hidden sm:block flex-1" />
            
            <Button 
              variant="neon" 
              size="lg" 
              className="h-12 md:h-14 gap-2 rounded-full px-8 md:px-12 shadow-2xl shadow-white/30 w-full sm:w-auto"
              onClick={generateImage}
              disabled={!prompt.trim() || isGenerating}
            >
              <Wand2 className={cn("w-4 h-4 md:w-5 h-5", isGenerating && "animate-spin")} />
              {isGenerating ? "FORGING..." : "GENERATE"}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-white" /> Your Gallery
            </h2>
            <div className="text-[10px] uppercase tracking-widest font-bold text-white/30">
              {images.length} ARCHIVES
            </div>
          </div>

          {images.length === 0 && !isGenerating ? (
            <div className="bg-white/[0.02] border border-white/[0.05] h-80 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-4 px-6">
              <ImageIcon className="w-16 h-16 text-white/5" />
              <p className="text-white/20 text-sm">Your generated masterpieces will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
              {images.map((img) => (
                <motion.div 
                  key={img.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative bg-white/[0.03] rounded-[2.5rem] overflow-hidden aspect-square border border-white/[0.06] shadow-2xl"
                >
                  <img 
                    src={img.url} 
                    alt={img.prompt} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8 space-y-6">
                    <p className="text-sm text-white/80 line-clamp-3 leading-relaxed font-medium">{img.prompt}</p>
                    <div className="flex gap-3">
                      <Button size="lg" variant="secondary" className="flex-1 gap-2 rounded-2xl h-12 bg-white/10 hover:bg-white text-white hover:text-black transition-all font-bold" onClick={() => window.open(img.url)}>
                        <Download className="w-4 h-4" /> Save
                      </Button>
                      <Button size="lg" variant="ghost" className="rounded-2xl h-12 w-12 text-red-400 hover:bg-red-500/10 transition-all" onClick={() => deleteImage(img.id)}>
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
