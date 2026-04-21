import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, Globe, Shield, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface HomeModuleProps {
  onExplore: () => void;
}

export function HomeModule({ onExplore }: HomeModuleProps) {
  return (
    <div className="h-full overflow-y-auto bg-black selection:bg-white selection:text-black custom-scrollbar">
      {/* Fine-tuned Background Accents */}
      <div className="absolute top-0 left-1/4 w-1/2 h-full bg-gradient-to-b from-white/[0.03] to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/[0.04] blur-[150px] rounded-full pointer-events-none" />

      <main className="container mx-auto px-6 py-24 relative z-10 flex flex-col items-center text-center">
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
          className="text-7xl md:text-[8rem] lg:text-[10rem] font-black tracking-[-0.05em] mb-12 max-w-6xl leading-[0.85] text-white"
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
          <Button size="lg" variant="neon" onClick={onExplore} className="gap-3 h-16 px-12 rounded-full font-black tracking-widest shadow-2xl shadow-white/10 group">
            Start Exploring <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button size="lg" variant="secondary" className="h-16 px-12 rounded-full font-black tracking-widest bg-white/5 border-white/10 text-white/60">Documentation</Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-40 w-full max-w-5xl">
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
              className="bg-white/[0.03] border border-white/5 p-10 rounded-[3rem] text-left hover:bg-white/[0.05] transition-colors"
            >
              <feature.icon className="w-10 h-10 text-white mb-6" />
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-40 w-full max-w-5xl bg-white/[0.02] border border-white/[0.05] rounded-[4rem] p-12 md:p-20 text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.02] blur-3xl rounded-full" />
          
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20 relative z-10">
            <div className="shrink-0 relative group">
              <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <img 
                src="https://res.cloudinary.com/drh369n9m/image/upload/v1749597275/pp_r6qtnu.jpg" 
                alt="Sandip Hembram" 
                referrerPolicy="no-referrer"
                className="w-48 h-48 md:w-64 md:h-64 rounded-full object-cover border-4 border-white/10 grayscale hover:grayscale-0 transition-all duration-700 shadow-2xl relative z-10"
              />
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-black">About the Founder</p>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">Sandip Hembram</h2>
                <p className="text-white/60 font-medium text-lg">Co-founder and CEO of Bhart AI</p>
              </div>
              
              <p className="text-white/40 leading-relaxed text-sm md:text-base max-w-xl">
                A visionary software architect and tech leader dedicated to democratizing AI for Bharat. 
                Under Sandip's leadership, Bhart AI is building inclusive, multimodal intelligence 
                that bridges the digital divide across India's diverse linguistic landscape.
              </p>
              
              <div className="flex gap-4">
                <div className="px-5 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full">Visionary</div>
                <div className="px-5 py-2.5 bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-full">Tech Innovator</div>
              </div>
            </div>
          </div>
        </motion.div>

        <footer className="mt-48 pb-24 border-t border-white/5 w-full pt-12 text-center space-y-4">
          <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">&copy; 2026 Bhart AI Platform. Built with Pride in India.</p>
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="pt-4"
          >
            <p className="text-white/40 text-[11px] font-medium tracking-wider leading-relaxed">
              Developed by <span className="text-white font-bold">Sandip Hembram</span>
            </p>
            <p className="text-white/20 text-[9px] uppercase tracking-[0.3em] mt-1">
              Co-founder and CEO of Bhart AI
            </p>
          </motion.div>
        </footer>
      </main>
    </div>
  );
}
