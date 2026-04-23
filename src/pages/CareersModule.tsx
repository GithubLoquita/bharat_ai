import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, MapPin, Globe, Clock, Rocket, Users, ChevronRight, CheckCircle2, AlertCircle, FileText, Send, Building2, GraduationCap, X, Plus, Filter, Trash2, ShieldCheck, Mail, Zap, ExternalLink, ArrowUpRight } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Remote' | 'Onsite' | 'Hybrid';
  description: string;
  requirements: string[];
  isInternship: boolean;
  active: boolean;
  createdAt: any;
}

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  resumeUrl: string;
  portfolioUrl?: string;
  note?: string;
  status: 'pending' | 'reviewing' | 'interviewing' | 'rejected' | 'hired';
  createdAt: any;
}

export function CareersModule() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [applyForm, setApplyForm] = useState({
    name: '',
    email: '',
    resumeUrl: '',
    portfolioUrl: '',
    note: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = auth.currentUser;
  const isAdmin = user?.email === 'sandiphembram2021@gmail.com';

  // Seed data if empty (Admin only)
  const seedJobs = async () => {
    if (!isAdmin) return;
    const initialJobs = [
      { title: "Senior AI Researcher", department: "Research", location: "Bengaluru, India", type: "Onsite", description: "Lead our efforts in multimodal model alignment.", requirements: ["PhD in AI/ML", "3+ years LLM exp"], active: true, isInternship: false },
      { title: "Backend Engineer", department: "Engineering", location: "Remote", type: "Remote", description: "Scalable inference APIs for billions of requests.", requirements: ["Go/Rust proficiency", "K8s experience"], active: true, isInternship: false },
      { title: "Product Designer", department: "Design", location: "Hybrid", type: "Hybrid", description: "Define the visual language of Bharat's AI.", requirements: ["Figma expert", "System thinker"], active: true, isInternship: false },
      { title: "AI Engineering Fellow", department: "Engineering", location: "Remote", type: "Remote", description: "Bhart AI flagship internship program.", requirements: ["Final year student", "Strong DSA"], active: true, isInternship: true }
    ];
    
    for (const job of initialJobs) {
      await addDoc(collection(db, 'jobs'), { ...job, createdAt: serverTimestamp() });
    }
    toast.success("Jobs seeded successfully");
  };

  useEffect(() => {
    const q = query(collection(db, 'jobs'), where('active', '==', true), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
      setIsLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isAdmin && isAdminView) {
      const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
      });
    }
  }, [isAdmin, isAdminView]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJob) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'applications'), {
        ...applyForm,
        jobId: activeJob.id,
        jobTitle: activeJob.title,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      toast.success("Application submitted successfully! Our team will review it soon.");
      setShowApplyForm(false);
      setActiveJob(null);
      setApplyForm({ name: '', email: '', resumeUrl: '', portfolioUrl: '', note: '' });
    } catch (error) {
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateAppStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'applications', id), { status });
    toast.success(`Status updated to ${status}`);
  };

  const timeline = [
    { title: "Application Review", desc: "Our talent team reviews your profile within 48 hours.", icon: Filter },
    { title: "Technical Sync", desc: "A 45-min deep dive into your technical skills and logic.", icon: Rocket },
    { title: "Cultural Fit", desc: "Meet the founders and the team you'll be working with.", icon: Users },
    { title: "Final Offer", desc: "Welcome to the future of Bharat's intelligence layer.", icon: CheckCircle2 }
  ];

  if (isLoading) return <div className="flex-1 flex items-center justify-center bg-black"><div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>;

  return (
    <div className="flex-1 overflow-y-auto bg-black custom-scrollbar">
      {/* Admin Toggle */}
      {isAdmin && (
        <div className="fixed top-6 right-6 z-50">
          <Button 
            onClick={() => setIsAdminView(!isAdminView)}
            className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest gap-2"
          >
            {isAdminView ? <Globe className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            {isAdminView ? 'Switch to Public' : 'Admin Panel'}
          </Button>
        </div>
      )}

      {isAdminView ? (
        <div className="p-12 lg:p-20 space-y-12 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tight text-white">Candidates</h1>
              <p className="text-white/40 uppercase text-[10px] font-black tracking-widest">Managing {applications.length} active applications</p>
            </div>
            <div className="flex gap-4">
               {jobs.length === 0 && (
                 <Button onClick={seedJobs} variant="outline" className="rounded-full border-white/10 text-[10px] uppercase font-black tracking-widest">Seed Listings</Button>
               )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {applications.map(app => (
              <div 
                key={app.id} 
                onClick={() => setSelectedApp(app)}
                className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-8 group hover:bg-white/[0.05] transition-all cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white">{app.name}</h3>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      app.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                      app.status === 'hired' ? "bg-green-500/10 text-green-500" : "bg-white/10 text-white/40"
                    )}>
                      {app.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-white/40 text-sm">
                    <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {app.email}</span>
                    <span className="flex items-center gap-1.5 font-bold text-white/60"><Briefcase className="w-4 h-4" /> {app.jobTitle}</span>
                  </div>
                  {app.note && <p className="text-sm text-white/30 italic max-w-xl">"{app.note}"</p>}
                </div>

                <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                  <select 
                    value={app.status}
                    onChange={(e) => updateAppStatus(app.id, e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-2xl px-4 py-2 text-xs text-white uppercase font-black tracking-widest outline-none focus:border-white/20"
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="rejected">Rejected</option>
                    <option value="hired">Hired</option>
                  </select>
                  <Button variant="outline" className="rounded-full h-12 px-6 bg-white/[0.05]" onClick={() => window.open(app.resumeUrl)}>
                    Resume
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-32 pb-32">
          {/* Hero */}
          <section className="relative h-[80vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.05),transparent)] z-0" />
             <div className="relative z-10 space-y-10 max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/5"
                >
                  <Sparkles className="w-4 h-4 text-white/40" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">We are Hiring</span>
                </motion.div>
                
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white">
                  Build the Future <br />
                  <span className="text-white/20 italic">of AI in Bharat.</span>
                </h1>

                <p className="text-xl md:text-2xl text-white/40 font-medium max-w-2xl mx-auto leading-relaxed">
                  Join a high-performance team of researchers and engineers architecting India's neural infrastructure.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                  <Button variant="neon" size="lg" className="h-16 px-12 rounded-full text-base font-black tracking-tight" onClick={() => document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' })}>
                    Explore Openings
                  </Button>
                  <Button variant="secondary" size="lg" className="h-16 px-12 rounded-full text-base border-white/5 bg-white/5 hover:bg-white/10">
                    Read Our Vision
                  </Button>
                </div>
             </div>
          </section>

          {/* Mission */}
          <section className="max-w-7xl mx-auto px-12 grid grid-cols-1 lg:grid-cols-2 gap-20 py-20 bg-white/[0.01] rounded-[4rem] border border-white/5">
            <div className="space-y-8">
              <div className="w-16 h-16 bg-white/[0.05] rounded-[2rem] flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-5xl font-black tracking-tight text-white">Why Join Bhart AI?</h2>
              <p className="text-xl text-white/40 leading-relaxed font-medium">
                We believe that the next decade of intelligence will be shaped by those who understand that scale requires local nuance. At Bhart AI, you won't just build models; you'll build the backbone of a smarter subcontinent.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { title: "Sovereign AI", desc: "Build non-biased, India-centric models.", icon: ShieldCheck },
                { title: "Ownership", desc: "You own your projects from research to prod.", icon: Rocket },
                { title: "Talent Density", desc: "Work with the top 0.1% of AI researchers.", icon: Users },
                { title: "Modern Tech", desc: "Access massive compute on our H100 clusters.", icon: Zap },
              ].map((item, i) => (
                <div key={i} className="p-8 rounded-[2.5rem] bg-white/[0.03] space-y-4 border border-white/5">
                  <item.icon className="w-6 h-6 text-white/40" />
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  <p className="text-sm text-white/30 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Listings */}
          <section id="listings" className="max-w-5xl mx-auto px-6 space-y-20">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">Open Openings</h2>
              <p className="text-white/40 uppercase text-[10px] font-black tracking-widest">Engineering • Design • Research</p>
            </div>

            <div className="space-y-6">
              {jobs.map(job => (
                <motion.div 
                  key={job.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => { setActiveJob(job); setShowApplyForm(true); }}
                  className="p-10 rounded-[3rem] bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all cursor-pointer group flex flex-col md:flex-row items-center justify-between gap-10"
                >
                  <div className="space-y-6 w-full">
                    <div className="flex flex-wrap gap-2">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5",
                         job.type === 'Remote' ? "text-green-400 border border-green-400/20" : "text-white/40 border border-white/10"
                      )}>
                        {job.type}
                      </span>
                      {job.isInternship && (
                        <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand/10 text-brand border border-brand/20">
                          Internship
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-3xl font-bold text-white group-hover:text-white transition-colors">{job.title}</h3>
                      <div className="flex items-center gap-6 text-white/40 text-sm font-medium">
                        <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {job.location}</span>
                        <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> {job.department}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-8 h-8 text-white/10 group-hover:text-white transition-all transform group-hover:translate-x-2" />
                </motion.div>
              ))}
            </div>
            
            {/* Internship Program */}
            <div className="bg-gradient-to-br from-white/[0.05] to-transparent p-12 lg:p-20 rounded-[4rem] border border-white/5 space-y-12">
               <div className="space-y-6 text-center lg:text-left">
                  <h3 className="text-4xl font-black tracking-tight text-white">NextGen Fellowship</h3>
                  <p className="text-xl text-white/40 font-medium leading-relaxed max-w-2xl">
                    Our 6-month undergraduate internship program for students who are building extraordinary projects. We provide mentorship, massive compute, and a direct path to full-time roles.
                  </p>
                  <Button variant="secondary" className="h-14 px-10 rounded-full text-xs font-black uppercase tracking-widest">Explore Fellowship</Button>
               </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="max-w-7xl mx-auto px-12 py-32 space-y-20">
            <div className="text-center">
              <h2 className="text-4xl font-black tracking-tight text-white mb-2">The Process</h2>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">From application to on-boarding</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              {timeline.map((step, i) => (
                <div key={i} className="relative space-y-6">
                  <div className="w-16 h-16 bg-white/[0.05] border border-white/10 rounded-3xl flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-white">{step.title}</h3>
                    <p className="text-sm text-white/30 font-medium leading-relaxed">{step.desc}</p>
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-20 w-full h-[1px] bg-white/5" />
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Application Modal */}
      <AnimatePresence>
        {showApplyForm && activeJob && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowApplyForm(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#121212] border border-white/10 p-12 rounded-[3.5rem] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <button 
                onClick={() => setShowApplyForm(false)}
                className="absolute top-8 right-8 p-3 text-white/20 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="space-y-10">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand">Application Form</p>
                  <h2 className="text-4xl font-black tracking-tight text-white">{activeJob.title}</h2>
                  <p className="text-white/40 text-sm">{activeJob.department} • {activeJob.location}</p>
                </div>

                <form onSubmit={handleApply} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Full Name</label>
                      <input 
                        required
                        value={applyForm.name}
                        onChange={(e) => setApplyForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-white/20" 
                        placeholder="Elon Musk"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Email Address</label>
                      <input 
                        type="email"
                        required
                        value={applyForm.email}
                        onChange={(e) => setApplyForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-white/20" 
                        placeholder="elon@mars.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Resume URL (Drive/PDF)</label>
                    <div className="relative">
                      <input 
                        required
                        value={applyForm.resumeUrl}
                        onChange={(e) => setApplyForm(prev => ({ ...prev, resumeUrl: e.target.value }))}
                        className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-white/20 pl-14" 
                        placeholder="https://drive.google.com/..."
                      />
                      <FileText className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Portfolio / GitHub</label>
                    <input 
                      value={applyForm.portfolioUrl}
                      onChange={(e) => setApplyForm(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                      className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-white/20" 
                      placeholder="github.com/..."
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Anything else?</label>
                    <textarea 
                      value={applyForm.note}
                      onChange={(e) => setApplyForm(prev => ({ ...prev, note: e.target.value }))}
                      className="w-full h-32 bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-white/20 resize-none" 
                      placeholder="Tell us about a project you're proud of..."
                    />
                  </div>

                  <Button 
                    type="submit" 
                    variant="neon" 
                    size="lg" 
                    className="w-full h-16 rounded-full text-base font-black tracking-tight gap-3"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Candidate Detail Modal */}
      <AnimatePresence>
        {isAdminView && selectedApp && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApp(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              className="relative w-full max-w-3xl bg-[#0A0A0A] border border-white/10 p-12 rounded-[4rem] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <button 
                onClick={() => setSelectedApp(null)}
                className="absolute top-10 right-10 p-3 text-white/20 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="space-y-12">
                {/* Header */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-3xl font-black text-white/20">
                      {selectedApp.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-4xl font-black tracking-tight text-white">{selectedApp.name}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5",
                          selectedApp.status === 'pending' ? "text-amber-500" :
                          selectedApp.status === 'hired' ? "text-green-500" : "text-white/40"
                        )}>
                          {selectedApp.status}
                        </span>
                        <span className="text-white/20 text-xs font-bold uppercase tracking-widest">{selectedApp.jobTitle}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-white/5">
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Contact Channel</p>
                      <a 
                        href={`mailto:${selectedApp.email}`}
                        className="flex items-center gap-3 text-lg font-bold text-white hover:text-brand transition-colors group"
                      >
                        <Mail className="w-5 h-5 text-white/40 group-hover:text-brand" />
                        {selectedApp.email}
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                      </a>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Artifacts</p>
                      <div className="grid grid-cols-1 gap-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          onClick={() => window.open(selectedApp.resumeUrl)}
                          className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-brand/10 rounded-2xl">
                              <FileText className="w-6 h-6 text-brand" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-black text-white">Curriculum Vitae</p>
                              <p className="text-[10px] text-white/30 uppercase tracking-widest">Main Resume</p>
                            </div>
                          </div>
                          <ExternalLink className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
                        </motion.button>

                        {selectedApp.portfolioUrl && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            onClick={() => window.open(selectedApp.portfolioUrl)}
                            className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-500/10 rounded-2xl">
                                <Globe className="w-6 h-6 text-blue-500" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-black text-white">Portfolio / Hub</p>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest">External Projects</p>
                              </div>
                            </div>
                            <ExternalLink className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4 pt-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Candidate Message</p>
                      <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/5 relative">
                        <p className="text-lg text-white/60 font-medium leading-relaxed italic">
                          {selectedApp.note ? `"${selectedApp.note}"` : "No personal note provided by candidate."}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Admin Actions</p>
                      <div className="flex flex-wrap gap-4">
                        <select 
                          value={selectedApp.status}
                          onChange={(e) => updateAppStatus(selectedApp.id, e.target.value)}
                          className="flex-1 min-w-[200px] h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-xs text-white uppercase font-black tracking-widest outline-none focus:border-white/20"
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="interviewing">Interviewing</option>
                          <option value="rejected">Rejected</option>
                          <option value="hired">Hired</option>
                        </select>
                        <Button 
                          variant="outline" 
                          className="h-14 px-8 rounded-2xl border-red-500/10 text-red-500/40 hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/20"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to remove this candidate?')) {
                              deleteDoc(doc(db, 'applications', selectedApp.id));
                              setSelectedApp(null);
                              toast.success('Candidate removed');
                            }
                          }}
                        >
                          <Trash2 className="w-5 h-5 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-12 border-t border-white/5 text-center">
                  <p className="text-[10px] text-white/10 uppercase font-black tracking-[0.3em]">
                    Application received on {selectedApp.createdAt?.toDate().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

const Sparkles = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>;
