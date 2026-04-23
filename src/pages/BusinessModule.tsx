import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Users, FileText, Bot, Plus, Search, Filter, 
  ChevronRight, Download, Send, Trash2, CheckCircle2, 
  Clock, TrendingUp, DollarSign, PieChart, MoreVertical,
  Mail, Phone, Building2, Calendar, LayoutDashboard,
  ArrowUpRight, ArrowDownRight, Tag, Save, X, Edit3, Sparkles, User as UserIcon
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDocs 
} from 'firebase/firestore';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { useSettings } from '../context/SettingsContext';
import { ai as systemAi } from '../lib/gemini';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';

// --- Interfaces ---

interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'Lead' | 'Client' | 'Lost';
  notes: string;
  userId: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
}

interface Invoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  total: number;
  status: 'Draft' | 'Sent' | 'Paid';
  dueDate: string;
  createdAt: any;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  customerId: string;
  customerName: string;
  status: 'New' | 'Negotiation' | 'Won' | 'Lost';
  userId: string;
}

// --- Main Component ---

export function BusinessModule() {
  const [activeSubTab, setActiveSubTab] = useState<'crm' | 'invoices' | 'assistant' | 'dashboard'>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { keys } = useSettings();
  const user = auth.currentUser;

  const seedBusinessData = async () => {
    if (!user || customers.length > 0) return;
    
    // Seed Customers
    const cust1 = await addDoc(collection(db, 'customers'), { name: 'Reliance Industries', email: 'procurement@ril.com', company: 'RIL', status: 'Client', userId: user.uid, createdAt: serverTimestamp() });
    const cust2 = await addDoc(collection(db, 'customers'), { name: 'Tata Consultancy Services', email: 'hr@tcs.com', company: 'TCS', status: 'Lead', userId: user.uid, createdAt: serverTimestamp() });

    // Seed Deals
    await addDoc(collection(db, 'deals'), { title: 'Cloud Infrastructure Upgrade', value: 45000, customerId: cust1.id, customerName: 'Reliance Industries', status: 'Negotiation', userId: user.uid, createdAt: serverTimestamp() });
    await addDoc(collection(db, 'deals'), { title: 'AI Automation Pilot', value: 12000, customerId: cust2.id, customerName: 'Tata Consultancy Services', status: 'New', userId: user.uid, createdAt: serverTimestamp() });

    // Seed Invoices
    await addDoc(collection(db, 'invoices'), { 
      invoiceNumber: 'INV-2024-001', 
      customerId: cust1.id, 
      customerName: 'Reliance Industries', 
      items: [{ description: 'Strategy Consulting', quantity: 20, rate: 500 }], 
      total: 10000, 
      status: 'Paid', 
      dueDate: '2024-12-30', 
      userId: user.uid, 
      createdAt: serverTimestamp() 
    });

    toast.success("Business dashboard initialized");
  };

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // --- Sync Logic ---

  useEffect(() => {
    if (!user) return;

    const unsubCustomers = onSnapshot(
      query(collection(db, 'customers'), where('userId', '==', user.uid)),
      (snap) => setCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)))
    );

    const unsubInvoices = onSnapshot(
      query(collection(db, 'invoices'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snap) => setInvoices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice)))
    );

    const unsubDeals = onSnapshot(
      query(collection(db, 'deals'), where('userId', '==', user.uid)),
      (snap) => setDeals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal)))
    );

    setIsLoading(false);
    return () => {
      unsubCustomers();
      unsubInvoices();
      unsubDeals();
    };
  }, [user]);

  // --- CRM Logic ---

  const addCustomer = async (data: Omit<Customer, 'id' | 'userId'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'customers'), { ...data, userId: user.uid, createdAt: serverTimestamp() });
      toast.success("Customer added to CRM");
      setShowCustomerModal(false);
    } catch (err) {
      toast.error("Failed to add customer");
    }
  };

  // --- Invoice Logic ---

  const generatePDF = (inv: Invoice) => {
    const doc = new jsPDF() as any;
    
    // Header
    doc.setFontSize(20);
    doc.text("INVOICE", 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Invoice #: ${inv.invoiceNumber}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Due Date: ${inv.dueDate}`, 20, 50);
    
    doc.text("Bill To:", 20, 65);
    doc.setFontSize(12);
    doc.text(inv.customerName, 20, 72);

    // Table
    const tableData = inv.items.map(item => [
      item.description,
      item.quantity,
      `$${item.rate.toFixed(2)}`,
      `$${(item.quantity * item.rate).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 85,
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillStyle: '#111' }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text(`Total: $${inv.total.toFixed(2)}`, 190, finalY, { align: 'right' });

    doc.save(`Invoice_${inv.invoiceNumber}.pdf`);
    toast.success("Exported to PDF");
  };

  // --- Sub-Modules ---

  const Dashboard = () => {
    const revenue = invoices.filter(i => i.status === 'Paid').reduce((acc, i) => acc + i.total, 0);
    const pending = invoices.filter(i => i.status === 'Sent').reduce((acc, i) => acc + i.total, 0);
    const pipelineValue = deals.filter(d => d.status !== 'Lost').reduce((acc, d) => acc + d.value, 0);

    const chartData = [
      { name: 'Revenue', value: revenue },
      { name: 'Pending', value: pending },
      { name: 'Pipeline', value: pipelineValue },
    ];

    return (
      <div className="space-y-12 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { label: "Net Revenue", value: `$${revenue.toLocaleString()}`, color: "text-green-400", icon: TrendingUp },
             { label: "Unpaid Invoices", value: `$${pending.toLocaleString()}`, color: "text-amber-400", icon: Clock },
             { label: "Pipeline Value", value: `$${pipelineValue.toLocaleString()}`, color: "text-blue-400", icon: Briefcase }
           ].map((stat, i) => (
             <div key={i} className="p-8 rounded-[3rem] bg-white/[0.03] border border-white/5 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center">
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20">{stat.label}</p>
                  <p className={cn("text-4xl font-black tracking-tight", stat.color)}>{stat.value}</p>
                </div>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="p-10 rounded-[3.5rem] bg-white/[0.02] border border-white/5 h-[400px]">
              <h3 className="text-xl font-bold text-white mb-8">Performance Mix</h3>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.1)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.1)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#4ade80' : index === 1 ? '#fbbf24' : '#60a5fa'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
           
           <div className="p-10 rounded-[3.5rem] bg-white/[0.02] border border-white/5 space-y-8 overflow-y-auto max-h-[400px] custom-scrollbar">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Recent Deals</h3>
                <Button variant="secondary" size="sm" className="rounded-full text-[10px] h-8 font-black uppercase tracking-widest">New Deal</Button>
              </div>
              <div className="space-y-4">
                {deals.map(deal => (
                  <div key={deal.id} className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                    <div>
                      <p className="font-bold text-white group-hover:text-white transition-colors">{deal.title}</p>
                      <p className="text-xs text-white/40 uppercase tracking-widest font-black mt-1">{deal.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-white">${deal.value.toLocaleString()}</p>
                      <span className="text-[10px] text-brand uppercase font-black tracking-widest">{deal.status}</span>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    );
  };

  const CRMView = () => {
    return (
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white px-2">Customers</h2>
            <p className="text-white/30 text-sm px-2 font-medium">Relationships driving your growth.</p>
          </div>
          <Button onClick={() => setShowCustomerModal(true)} variant="neon" className="rounded-full h-14 px-8 font-black tracking-tight gap-2">
            <Plus className="w-5 h-5" /> Add Customer
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map(cust => (
            <motion.div 
               layoutId={cust.id}
               key={cust.id} 
               className="p-10 rounded-[3.5rem] bg-white/[0.03] border border-white/5 space-y-8 hover:bg-white/[0.05] transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-brand/5" />
              
              <div className="flex items-start justify-between relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center text-xl font-black text-white/40">
                  {cust.name.charAt(0)}
                </div>
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                  cust.status === 'Client' ? "bg-green-500/10 text-green-500" : 
                  cust.status === 'Lead' ? "bg-blue-500/10 text-blue-500" : "bg-white/10 text-white/30"
                )}>
                  {cust.status}
                </span>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white tracking-tight">{cust.name}</h3>
                  <p className="text-white/40 font-bold uppercase text-[10px] tracking-widest flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" /> {cust.company}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3 text-sm text-white/40 group-hover:text-white transition-colors">
                    <Mail className="w-4 h-4" />
                    <span>{cust.email}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 relative z-10 flex gap-3">
                <Button variant="secondary" className="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest h-10 border-white/5 bg-white/5">
                  View Profile
                </Button>
                <Button variant="outline" className="w-10 h-10 p-0 rounded-full border-white/5 text-white/20 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const InvoicesView = () => {
    return (
      <div className="space-y-10 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
             <h2 className="text-3xl font-black text-white px-2 tracking-tight">Billing Center</h2>
             <p className="text-white/30 text-sm px-2 font-medium tracking-tight">Create and manage your professional invoices.</p>
          </div>
          <Button onClick={() => setShowInvoiceModal(true)} variant="neon" className="rounded-full h-14 px-8 font-black tracking-tight gap-2">
            <Plus className="w-5 h-5" /> Create Invoice
          </Button>
        </div>

        <div className="overflow-hidden rounded-[3rem] border border-white/5 bg-white/[0.01]">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Invoice</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Client</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Status</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Due Date</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 text-right">Amount</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20"></th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {invoices.map(inv => (
                   <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-10 py-8">
                        <p className="font-bold text-white tracking-tight">{inv.invoiceNumber}</p>
                        <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-0.5">Aug 2024</p>
                      </td>
                      <td className="px-10 py-8">
                        <p className="font-bold text-white/80">{inv.customerName}</p>
                      </td>
                      <td className="px-10 py-8">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                          inv.status === 'Paid' ? "bg-green-500/10 text-green-500" : 
                          inv.status === 'Sent' ? "bg-amber-500/10 text-amber-500" : "bg-white/10 text-white/30"
                        )}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-sm text-white/40 font-medium">{inv.dueDate}</td>
                      <td className="px-10 py-8 text-right">
                        <p className="text-lg font-black text-white">${inv.total.toLocaleString()}</p>
                      </td>
                      <td className="px-10 py-8 text-right">
                         <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="icon" className="w-10 h-10 border-white/5 bg-white/5 text-white/20 hover:text-white" onClick={() => generatePDF(inv)}>
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="w-10 h-10 border-white/5 bg-white/5 text-white/20 hover:text-white">
                              <Send className="w-4 h-4" />
                            </Button>
                         </div>
                      </td>
                   </tr>
                 ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const BusinessAssistantView = () => {
    const [messages, setMessages] = useState<{role: 'user' | 'model', content: string}[]>([]);
    const [input, setInput] = useState('');
    const [isBusy, setIsBusy] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const prompt = `You are a strategic business consultant and revenue optimizer. You have access to the following aggregate data: Customers: ${customers.length}, Invoices: ${invoices.length}, Sales Pipeline: ${deals.length}. Help the user with startup strategy, invoice drafting, lead scoring, and growth hacking.`;

    const aiInstance = useMemo(() => {
      if (keys.gemini) return new GoogleGenAI({ apiKey: keys.gemini });
      return systemAi;
    }, [keys.gemini]);

    const handleSend = async () => {
      if (!input.trim() || isBusy) return;
      const userMsg = input;
      setInput('');
      setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
      setIsBusy(true);

      try {
        const chat = aiInstance.chats.create({
          model: "gemini-3-flash-preview",
          config: { systemInstruction: prompt },
          history: messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
        });
        const res = await chat.sendMessage({ message: userMsg });
        setMessages(prev => [...prev, { role: 'model', content: res.text || '' }]);
      } catch (err) { toast.error("Assistant sync failed"); }
      finally { setIsBusy(false); }
    };

    return (
      <div className="h-[70vh] flex flex-col bg-white/[0.01] rounded-[4rem] border border-white/5 p-12 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 p-8">
           <Bot className="w-6 h-6 text-white/10" />
        </div>
        <div className="flex-1 overflow-y-auto space-y-8 pr-4 mb-8 custom-scrollbar" ref={scrollRef}>
           {messages.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-brand/10 border border-brand/20 rounded-[2.5rem] flex items-center justify-center animate-pulse">
                  <Sparkles className="w-8 h-8 text-brand" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white">Revenue Intelligence</h3>
                  <p className="text-white/30 max-w-sm mx-auto font-medium leading-relaxed">Ask about growth strategy, market positioning, or invoice drafting.</p>
                </div>
             </div>
           )}
           {messages.map((m, i) => (
             <motion.div key={i} className={cn("flex gap-5", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-white/5", m.role === 'user' ? "bg-white/10 text-white" : "bg-white text-black")}>
                   {m.role === 'user' ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={cn("p-8 rounded-[2.5rem] text-sm leading-relaxed max-w-[80%]", m.role === 'user' ? "bg-white text-black font-bold" : "bg-white/[0.05] text-white/80 markdown-body-dark")}>
                  <Markdown>{m.content}</Markdown>
                </div>
             </motion.div>
           ))}
        </div>
        <div className="flex items-center gap-4 bg-white/[0.03] p-2.5 rounded-full border border-white/10">
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent px-8 py-3.5 outline-none text-white placeholder:text-white/20 text-sm"
            placeholder="Ask strategy..."
          />
          <Button variant="neon" size="icon" onClick={handleSend} className="h-12 w-12 rounded-full" disabled={!input.trim() || isBusy}>
             <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  // --- Modal Sub-Components ---

  const AddCustomerModal = () => {
    const [form, setForm] = useState({ name: '', email: '', company: '', status: 'Lead' as const, notes: '' });
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl bg-[#111] border border-white/10 p-12 rounded-[4rem] shadow-2xl relative">
           <button onClick={() => setShowCustomerModal(false)} className="absolute top-10 right-10 text-white/20 hover:text-white"><X className="w-6 h-6" /></button>
           <h2 className="text-3xl font-black text-white mb-10">New Relationship</h2>
           <div className="space-y-8">
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Display Name</label>
                 <input className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl px-6 text-white" placeholder="Contact Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Email</label>
                   <input className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl px-6 text-white" placeholder="email@corp.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Company</label>
                   <input className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl px-6 text-white" placeholder="Acme Inc." value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
                </div>
              </div>
              <Button onClick={() => addCustomer(form)} variant="neon" className="w-full h-16 rounded-full font-black text-base shadow-xl">Engage Customer</Button>
           </div>
        </motion.div>
      </div>
    );
  };

  if (isLoading) return <div className="h-full bg-black" />;

  return (
    <div className="flex-1 flex flex-col bg-black overflow-hidden h-full"> 
      <header className="p-8 lg:p-12 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-8 shrink-0">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black tracking-tighter text-white">Business Suite</h1>
            <span className="px-3 py-1 bg-brand/10 text-brand text-[8px] font-black uppercase tracking-widest rounded-full border border-brand/20">Alpha</span>
            {customers.length === 0 && (
              <Button onClick={seedBusinessData} variant="outline" className="h-6 px-3 rounded-full text-[8px] font-black uppercase tracking-widest border-white/10 hover:bg-white/5">
                Seed Business Suite
              </Button>
            )}
          </div>
          <p className="text-white/30 text-[15px] font-medium tracking-tight">Enterprise intelligence for Bharat's builders.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 p-2 rounded-full overflow-hidden self-start">
           {[
             { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
             { id: 'crm', label: 'CRM / Leads', icon: Users },
             { id: 'invoices', label: 'Invoices', icon: FileText },
             { id: 'assistant', label: 'AI Strategy', icon: Bot }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveSubTab(tab.id as any)}
               className={cn(
                 "flex items-center gap-2.5 px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all",
                 activeSubTab === tab.id ? "bg-white text-black shadow-lg" : "text-white/30 hover:text-white/60 hover:bg-white/[0.02]"
               )}
             >
               <tab.icon className="w-4 h-4" />
               <span className="hidden sm:inline">{tab.label}</span>
             </button>
           ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {activeSubTab === 'dashboard' && <Dashboard />}
            {activeSubTab === 'crm' && <CRMView />}
            {activeSubTab === 'invoices' && <InvoicesView />}
            {activeSubTab === 'assistant' && <BusinessAssistantView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {showCustomerModal && <AddCustomerModal />}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .neon-glow { box-shadow: 0 0 20px rgba(255,255,255,0.05); }
        .markdown-body-dark { color: rgba(255,255,255,0.8); }
        .markdown-body-dark h1, .markdown-body-dark h2, .markdown-body-dark h3 { color: white; margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 800; letter-spacing: -0.025em; }
        .markdown-body-dark p { margin-bottom: 1em; line-height: 1.7; font-weight: 500; }
        .markdown-body-dark ul { list-style-type: disc; margin-left: 1.5em; margin-bottom: 1em; color: rgba(255,255,255,0.6); }
        .markdown-body-dark li { margin-top: 0.5em; }
        .markdown-body-dark border-b { border-bottom: 1px solid rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
