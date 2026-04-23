import { motion } from 'framer-motion';
import { Sparkles, Shield, Cpu, Zap, Globe, Heart, Users, Target, Rocket } from 'lucide-react';

export function AboutModule() {
  const stats = [
    { label: "AI Models", value: "10+", icon: BrainCircuit },
    { label: "Active Nodes", value: "24/7", icon: Zap },
    { label: "Regions", value: "India", icon: Globe },
    { label: "Accuracy", value: "99.2%", icon: Target }
  ];

  const coreValues = [
    {
      title: "Privacy First",
      desc: "Our zero-knowledge infrastructure ensures your data remains your property. We don't train on your personal bytes.",
      icon: Shield
    },
    {
      title: "India Centric",
      desc: "Architected to understand the unique linguistic and cultural nuances of Bharat's diverse landscape.",
      icon: Heart
    },
    {
      title: "Edge Computing",
      desc: "Utilizing state-of-the-art inference nodes to provide ultra-low latency intelligence across the subcontinent.",
      icon: Cpu
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-black p-6 md:p-12 lg:p-20 custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-24">
        
        {/* Hero Section */}
        <div className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.03] border border-white/5"
          >
            <Sparkles className="w-4 h-4 text-white/40" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">The Future of Bharat AI</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white"
          >
            Intelligence <br />
            <span className="text-white/20 italic">Architected for</span> <br />
            Bharat.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Bhart AI is a research-driven intelligence company dedicated to building the backbone of India's cognitive infrastructure. We bridge the gap between advanced neural networks and local accessibility.
          </motion.p>
        </div>

        {/* Mission Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative group p-12 rounded-[4rem] bg-white/[0.02] border border-white/10 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 space-y-8">
            <div className="w-16 h-16 bg-white/[0.05] rounded-[1.5rem] flex items-center justify-center border border-white/10">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black tracking-tight text-white">Our Mission</h2>
              <p className="text-xl text-white/40 font-medium leading-relaxed">
                To democratize high-fidelity AI for every Indian, ensuring language, geography, and hardware are no longer barriers to human potential. We are building a world where every Indian has a personal, secure, and hyper-intelligent ally.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Core Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {coreValues.map((value, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (idx * 0.1) }}
              className="p-8 rounded-[3rem] bg-white/[0.02] border border-white/5 space-y-6 hover:bg-white/[0.04] transition-all"
            >
              <div className="p-3 bg-white/[0.03] rounded-2xl w-fit">
                <value.icon className="w-5 h-5 text-white/60" />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">{value.title}</h3>
                <p className="text-sm text-white/30 leading-relaxed font-medium">{value.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* The Founder Section */}
        <div className="pt-24 border-t border-white/5">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="w-48 h-48 md:w-64 md:h-64 rounded-[3rem] overflow-hidden border-2 border-white/10 grayscale hover:grayscale-0 transition-all duration-700 shadow-2xl"
            >
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sandip" 
                alt="Sandip Hembram" 
                className="w-full h-full object-cover bg-neutral-900" 
              />
            </motion.div>
            <div className="space-y-6 text-center md:text-left flex-1">
              <div className="space-y-1">
                <h3 className="text-4xl font-black tracking-tight text-white">Sandip Hembram</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Founder & Lead Architect</p>
              </div>
              <p className="text-lg text-white/40 font-medium leading-relaxed italic">
                "Intelligence should not be a privilege. It should be a fundamental utility, as accessible as electricity or water. Bhart AI is my commitment to ensuring Bharat leads the cognitive era."
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-12 text-center pb-12">
          <p className="text-[10px] text-white/5 uppercase font-black tracking-[0.5em]">
            Bhart AI © 2026 • Intelligent infrastructure for the next billion.
          </p>
        </div>
      </div>
    </div>
  );
}

const BrainCircuit = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .52 8.105 4 4 0 0 0 5.327 2.305 3 3 0 0 0 5.32-2.305 4 4 0 0 0 .52-8.105 4 4 0 0 0-2.526-5.77A3 3 0 1 0 12 5Z"/><path d="M9 13a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/><path d="M19 13a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/></svg>;
