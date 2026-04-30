import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, BookOpen, History, Users, Upload, AlertTriangle, CheckCircle, Plus, 
  Save, MessageSquare, ChevronRight, ShieldAlert, Search, Bell, LayoutDashboard, 
  Clock, Briefcase, Activity, Calendar, LogOut, Settings, MoreVertical, Eye, 
  FileDiff, Download, RotateCcw, Check, X, FolderTree, Filter, Tag, Building, 
  UserCheck, Layers, ChevronDown, ShieldCheck, UserPlus, Trash2, Mail, Lock, 
  Edit2, TrendingUp, ExternalLink, PlusCircle, Trash, FolderOpen, Sparkles, Wand2,
  BrainCircuit, Zap, ListChecks, MessageCircle, FileUp, Terminal, BarChart3, PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import mammoth from 'mammoth';
import { diff_match_patch } from 'diff-match-patch';
import { USERS, INITIAL_PLAYBOOK, PlaybookClause, AuditLogEntry, User, Contract, Version } from './types';

const dmp = new diff_match_patch();

const MOCK_CONTRACTS: Contract[] = [
  { id: 'c1', title: 'Global Vendor Agreement', content: "This Agreement is dated 2024. The parties agree as follows:\n\n1. GOVERNING LAW: This contract is governed by the laws of New York.\n\n2. LIABILITY: The total liability of the parties shall be unlimited in all circumstances.\n\n3. TERMINATION: Either party can terminate this agreement instantly without notice.", lastModifiedBy: 'Ian Loe', status: 'Live', expiryDate: '2024-12-15', value: '$250k', businessUnit: 'Retail', department: 'Procurement', legalRep: 'Sarah Chen', category: 'Vendor' },
  { id: 'c2', title: 'Software License - Adobe', content: "Adobe license content...", lastModifiedBy: 'Sarah Chen', status: 'Review', expiryDate: '2025-01-10', value: '$50k', businessUnit: 'Tech', department: 'IT', legalRep: 'Ian Loe', category: 'IT' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contract' | 'repository' | 'playbook' | 'users' | 'settings' | 'audit'>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [passwordChange, setPasswordChange] = useState({ current: '', new: '', confirm: '' });
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);
  const [playbook, setPlaybook] = useState<PlaybookClause[]>(INITIAL_PLAYBOOK || []);
  const [contracts, setContracts] = useState<Contract[]>(MOCK_CONTRACTS || []);
  const [appUsers, setAppUsers] = useState<User[]>(USERS || []);
  const [tags, setTags] = useState({ BUs: ['Retail', 'Tech', 'Marketing', 'Finance', 'Legal'], Depts: ['Procurement', 'IT', 'Digital', 'Tax', 'HR'], Categories: ['Vendor', 'IT', 'Marketing', 'Services', 'Employment'] });
  
  const [contractContent, setContractContent] = useState(MOCK_CONTRACTS[0].content);
  const [currentContract, setCurrentContract] = useState<Contract | null>(MOCK_CONTRACTS?.[0] || null);
  const [versions, setVersions] = useState<Version[]>([
    { id: 'v1', contractId: 'c1', content: MOCK_CONTRACTS[0].content, timestamp: new Date(Date.now() - 86400).toISOString(), author: 'System', label: 'Baseline' },
  ]);
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [repoFilter, setRepoFilter] = useState({ bu: 'All', status: 'All' });
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

  // AI & Modals
  const [isAISummarizing, setIsAISummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAIWriting, setIsAIWriting] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [showPlaybookModal, setShowPlaybookModal] = useState(false);
  const [editingClause, setEditingClause] = useState<Partial<PlaybookClause> | null>(null);
  const [showTagModal, setShowTagModal] = useState<{ type: 'BUs' | 'Depts' | 'Categories', value?: string, original?: string } | null>(null);

  const addLogEntry = (action: string, details: string) => {
    const entry: AuditLogEntry = { 
      id: Math.random().toString(36).substr(2, 9), 
      timestamp: new Date().toISOString(), 
      userId: currentUser?.id || 'system', 
      userName: currentUser?.name || 'System', 
      action, 
      details 
    };
    setAuditLog([entry, ...auditLog]);
  };

  const [conflicts, setConflicts] = useState<{clauseId: string, index: number}[]>([]);
  const runCheck = (content: string) => {
    if (!content || !Array.isArray(playbook)) return;
    try {
      const results: {clauseId: string, index: number}[] = [];
      const lowerC = String(content || "").toLowerCase();
      playbook.forEach(p => {
        if (!p?.title || !p?.preferredLanguage) return;
        const lowerT = String(p.title || "").toLowerCase();
        if (lowerC.includes(lowerT)) {
          const lowerP = String(p.preferredLanguage || "").toLowerCase().substring(0, 20);
          if (!lowerC.includes(lowerP)) {
            results.push({ clauseId: p.id, index: content.indexOf(p.title) });
          }
        }
      });
      setConflicts(results);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { runCheck(contractContent); }, [contractContent, playbook]);

  const saveContract = () => {
    if (!currentContract) return;
    const next = contracts.map(c => c.id === currentContract.id ? { ...currentContract, content: contractContent, lastModifiedBy: currentUser?.name || 'Unknown' } : c);
    setContracts(next);
    addLogEntry('Document Save', `Updated version of ${currentContract.title}`);
    alert('Contract saved successfully!');
  };

  const getAccessible = () => {
    const list = Array.isArray(contracts) ? contracts : [];
    if (!currentUser?.allowedBUs || currentUser.allowedBUs.length === 0) return list;
    return list.filter(c => c && currentUser.allowedBUs?.includes(c.businessUnit || ''));
  };

  const filtered = getAccessible().filter(c => {
    if (!c) return false;
    const s = String(searchQuery || "").toLowerCase();
    const matchesSearch = String(c.title || "").toLowerCase().includes(s);
    const matchesBU = repoFilter.bu === 'All' || c.businessUnit === repoFilter.bu;
    const matchesStatus = repoFilter.status === 'All' || c.status === repoFilter.status;
    return matchesSearch && matchesBU && matchesStatus;
  });

  const renderRedlines = (base: string, current: string) => {
    try {
      const diffs = dmp.diff_main(base || "", current || "");
      dmp.diff_cleanupSemantic(diffs);
      return diffs.map((part: [number, string], index: number) => {
        const [type, text] = part;
        if (type === 1) return <span key={index} className="text-green-500 bg-green-500/10 px-0.5 rounded">{text}</span>;
        if (type === -1) return <span key={index} className="text-red-500 bg-red-500/10 line-through px-0.5 rounded">{text}</span>;
        return <span key={index}>{text}</span>;
      });
    } catch (e) { return <span>{current}</span>; }
  };








  // --- Main Layout ---

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="glass-card bg-slate-900/40 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/20 mb-6">
                <ShieldAlert className="text-white" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
              <p className="text-slate-500 mt-2 font-medium">LexGuard Enterprise CLM</p>
            </div>
            
            <form className="space-y-6" onSubmit={(e) => {
              e.preventDefault();
              const user = USERS.find(u => u.email === loginForm.email && u.password === loginForm.password);
              if (user) {
                setCurrentUser(user);
                setIsAuthenticated(true);
                addLogEntry('Authentication', `User ${user.name} logged in successfully.`);
              } else {
                alert('Invalid credentials. Try ian@lexguard.ai / password123');
              }
            }}>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email" 
                    value={loginForm.email}
                    onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:ring-2 focus:ring-purple-600/50 outline-none transition-all shadow-inner" 
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Security Key</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="password" 
                    value={loginForm.password}
                    onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:ring-2 focus:ring-purple-600/50 outline-none transition-all shadow-inner" 
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="w-4 h-4 rounded border border-slate-700 bg-slate-950 group-hover:border-purple-500 transition-colors" />
                  <span className="text-xs text-slate-500 font-medium">Remember session</span>
                </label>
                <button type="button" className="text-xs text-purple-400 font-bold hover:text-purple-300 transition-colors">Recover Access</button>
              </div>
              
              <button 
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-2xl font-bold shadow-xl shadow-purple-900/40 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
              >
                Authorize Access <ChevronRight size={18} />
              </button>
            </form>
            
            <div className="mt-10 pt-8 border-t border-slate-800/50 text-center">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">Restricted Government & Enterprise Access Only</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200 font-sans">
      <aside className="w-64 border-r border-slate-800 flex flex-col glass sticky top-0 h-screen z-50">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 transition-all hover:rotate-12"><ShieldAlert className="text-white" size={24} /></div>
          <div><h1 className="text-xl font-bold text-white tracking-tighter">LEXGUARD</h1><p className="text-[10px] text-purple-500 font-bold uppercase tracking-widest">Enterprise CLM</p></div>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Intelligence' },
            { id: 'repository', icon: FolderTree, label: 'Vault' },
            { id: 'contract', icon: FileText, label: 'Smart Editor' },
            { id: 'playbook', icon: BookOpen, label: 'Playbook' },
            { id: 'audit', icon: History, label: 'Audit Trail' },
            { id: 'users', icon: Users, label: 'Identity' },
            { id: 'settings', icon: Settings, label: 'Taxonomy' }
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>
              <item.icon size={18} /> <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
           <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex items-center gap-3 transition-all hover:border-slate-700">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold bg-purple-600 text-white shadow-lg">{currentUser?.name?.[0]}</div>
              <div className="flex-1 min-w-0"><p className="text-xs font-bold text-white truncate">{currentUser?.name}</p><p className="text-[10px] text-slate-500 uppercase truncate font-medium">{currentUser?.role}</p></div>
           </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="glass h-20 px-8 flex items-center justify-between border-b border-slate-800 shrink-0 shadow-sm relative z-40">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input type="text" placeholder="Global intelligence search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-300 focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-inner" />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex -space-x-2">
              {appUsers.map((u: User) => (
                <button key={u.id} onClick={() => { setCurrentUser(u); addLogEntry('Context Switch', `Switched workspace to ${u.name}`); }} className={`w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold transition-all hover:scale-110 active:scale-95 shadow-md ${currentUser?.id === u.id ? 'ring-2 ring-purple-500 z-10' : 'opacity-40 hover:opacity-100'}`} style={{ backgroundColor: u.color }} title={u.name}>{u.name?.[0]}</button>
              ))}
            </div>
            <div className="w-[1px] h-8 bg-slate-800 mx-2" />
            <Bell size={20} className="text-slate-400 hover:text-white transition-colors cursor-pointer" />
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto bg-[#020617] scrollbar-hide relative z-30">
          <AnimatePresence mode="wait">
             {activeTab === 'dashboard' && (
               <div className="space-y-8 animate-fade-in">
                 <div className="flex items-center justify-between">
                    <div><h2 className="text-3xl font-bold text-white">Intelligence Dashboard</h2><p className="text-slate-500">Global Legal Operations</p></div>
                    <div className="flex gap-2 bg-purple-500/10 p-2 rounded-xl border border-purple-500/20"><Sparkles className="text-purple-500 animate-pulse" size={16} /><span className="text-[10px] font-bold text-purple-400 uppercase">AI Reviewer Active</span></div>
                 </div>
                 <div className="grid grid-cols-4 gap-6">
                   {[
                     { label: 'In Queue', val: getAccessible().filter(c => c.status === 'In Queue').length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                     { label: 'Live', val: getAccessible().filter(c => c.status === 'Live').length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
                     { label: 'Reviewing', val: getAccessible().filter(c => c.status === 'Review').length, icon: Eye, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                     { label: 'Conflicts', val: conflicts.length, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' }
                   ].map((s, i) => (
                     <div key={i} className="glass-card p-6 rounded-2xl border border-slate-800 transition-all hover:scale-105">
                        <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center mb-4`}><s.icon className={s.color} size={24} /></div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
                        <h3 className="text-4xl font-bold text-white mt-1">{s.val}</h3>
                     </div>
                   ))}
                 </div>
                 <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-8 glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                       <div className="p-6 border-b border-slate-800 bg-slate-900/20 flex items-center justify-between"><h3 className="text-lg font-bold text-white">Active Repository</h3><Search size={16} className="text-slate-500" /></div>
                       <table className="w-full text-left text-sm">
                         <thead className="bg-slate-900/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                            <tr><th className="px-6 py-4">Contract</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">BU</th><th className="px-6 py-4 text-right">Value</th></tr>
                         </thead>
                         <tbody className="divide-y divide-slate-800">
                            {filtered.map(c => (
                              <tr key={c.id} className="hover:bg-slate-900/40 cursor-pointer group" onClick={() => { setCurrentContract(c); setContractContent(c.content || ""); setActiveTab('contract'); }}>
                                <td className="px-6 py-4 font-bold text-white group-hover:text-blue-400 transition-colors">{c.title}</td>
                                <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.status === 'Live' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>{c.status}</span></td>
                                <td className="px-6 py-4 text-slate-500">{c.businessUnit}</td>
                                <td className="px-6 py-4 text-right font-mono text-blue-400">{c.value}</td>
                              </tr>
                            ))}
                         </tbody>
                       </table>
                    </div>
                    <div className="col-span-4 space-y-6">
                       <div className="glass-card p-6 rounded-2xl border border-slate-800 shadow-xl">
                          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><PieChart className="text-purple-500" size={20} /> Compliance Pulse</h3>
                          <div className="space-y-4">
                             <div><div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 mb-2"><span>Standardization</span><span>88%</span></div><div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[88%]" /></div></div>
                             <div><div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 mb-2"><span>Risk Exposure</span><span>Medium</span></div><div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-amber-500 w-[45%]" /></div></div>
                          </div>
                       </div>
                       <div className="glass-card p-6 rounded-2xl border border-slate-800 shadow-xl">
                          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Activity className="text-blue-500" size={20} /> Event Stream</h3>
                          <div className="space-y-4">
                             {auditLog.slice(0, 4).map(log => (
                                <div key={log.id} className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" /><div><p className="text-xs text-white font-medium">{log.action}</p><p className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</p></div></div>
                             ))}
                             {auditLog.length === 0 && <p className="text-xs text-slate-600 italic">Listening for system events...</p>}
                          </div>
                       </div>
                    </div>
                 </div>
               </div>
             )}
             {activeTab === 'repository' && (
               <div className="space-y-8 animate-fade-in">
                  <div className="flex items-center justify-between">
                     <h2 className="text-3xl font-bold text-white">Digital Vault</h2>
                     <div className="flex gap-4">
                        <select value={repoFilter.bu} onChange={e => setRepoFilter({...repoFilter, bu: e.target.value})} className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 outline-none focus:ring-1 focus:ring-purple-500 transition-all">
                           <option value="All">All Business Units</option>
                           {tags.BUs.map(bu => <option key={bu} value={bu}>{bu}</option>)}
                        </select>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                     {filtered.map(c => (
                        <div key={c.id} className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-blue-600 transition-all cursor-pointer flex items-center justify-between group" onClick={() => { setCurrentContract(c); setContractContent(c.content || ""); setActiveTab('contract'); }}>
                           <div className="flex items-center gap-6">
                              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform"><FolderOpen size={24} /></div>
                              <div><h4 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{c.title}</h4><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{c.businessUnit} • {c.department} • {c.category || 'Standard'}</p></div>
                           </div>
                           <div className="flex items-center gap-8">
                              <div className="text-right hidden sm:block"><p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Last Modified By</p><p className="text-xs text-slate-300 font-medium">{c.lastModifiedBy}</p></div>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${c.status === 'Live' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>{c.status}</span>
                              <ChevronRight className="text-slate-700 group-hover:text-white transition-colors" />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
             )}
             {activeTab === 'playbook' && (
               <div className="animate-fade-in space-y-8">
                  <div className="flex items-center justify-between">
                     <h2 className="text-3xl font-bold text-white">Playbook Architecture</h2>
                     <button onClick={() => { setEditingClause({ id: Math.random().toString(36).substr(2, 9), title: '', description: '', preferredLanguage: '', riskLevel: 'Low' }); setShowPlaybookModal(true); }} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all hover:scale-105 active:scale-95"><PlusCircle size={16} /> Define Clause</button>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                     {playbook.map(p => (
                        <div key={p.id} className="glass-card p-6 rounded-2xl border border-slate-800 group relative overflow-hidden transition-all hover:border-purple-600/50">
                           <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                              <button onClick={() => { setEditingClause(p); setShowPlaybookModal(true); }} className="p-1.5 bg-slate-800 rounded hover:text-white transition-colors shadow-lg"><Edit2 size={14} /></button>
                              <button onClick={() => { setPlaybook(playbook.filter(x => x.id !== p.id)); addLogEntry('Playbook Delete', `Removed clause: ${p.title}`); }} className="p-1.5 bg-slate-800 rounded hover:text-red-500 transition-colors shadow-lg"><Trash2 size={14} /></button>
                           </div>
                           <div className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase mb-4 inline-block tracking-widest ${p.riskLevel === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>{p.riskLevel} Risk</div>
                           <h4 className="font-bold text-white mb-2">{p.title}</h4>
                           <p className="text-xs text-slate-500 mb-4 line-clamp-3 leading-relaxed">{p.description}</p>
                           <div className="p-4 bg-slate-950/50 rounded-xl text-[10px] text-blue-400 font-mono italic border border-slate-800 group-hover:border-purple-500/30 transition-all">"{p.preferredLanguage}"</div>
                        </div>
                     ))}
                  </div>
               </div>
             )}
             {activeTab === 'users' && (
                <div className="animate-fade-in space-y-12">
                   <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-3xl font-bold text-white">Identity Governance</h2>
                        <p className="text-slate-500 font-medium mt-1">Manage organizational access and security protocols.</p>
                      </div>
                      <button onClick={() => { setEditingUser({ id: Math.random().toString(36).substr(2, 9), name: '', email: '', role: '', color: '#3b82f6', allowedBUs: [] }); setShowUserModal(true); }} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:scale-105"><UserPlus size={16} /> Invite Member</button>
                   </div>

                   <div className="grid grid-cols-12 gap-8">
                     <div className="col-span-8">
                       <div className="glass-card rounded-[2rem] border border-slate-800 overflow-hidden shadow-2xl">
                          <table className="w-full text-left text-sm">
                             <thead className="bg-slate-900/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                                <tr><th className="px-6 py-4">Identity</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">BU Restrictions</th><th className="px-6 py-4 text-right">Actions</th></tr>
                             </thead>
                             <tbody className="divide-y divide-slate-800">
                                {appUsers.map(u => (
                                   <tr key={u.id} className="hover:bg-slate-900/40 group transition-colors">
                                      <td className="px-6 py-4 font-bold text-white flex items-center gap-3"><div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg" style={{ backgroundColor: u.color }}>{u.name?.[0]}</div>{u.name}</td>
                                      <td className="px-6 py-4 text-slate-400 text-xs">{u.email}</td>
                                      <td className="px-6 py-4 text-slate-400 font-medium">{u.role}</td>
                                      <td className="px-6 py-4">
                                         <div className="flex flex-wrap gap-1">
                                            {(u.allowedBUs || []).map(bu => <span key={bu} className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[8px] font-bold border border-blue-500/20">{bu}</span>)}
                                            {(!u.allowedBUs || u.allowedBUs.length === 0) && <span className="text-[8px] text-slate-600 font-bold uppercase italic tracking-widest">Global Access</span>}
                                         </div>
                                      </td>
                                      <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                         <div className="flex justify-end gap-2">
                                            <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"><Edit2 size={14} /></button>
                                            <button onClick={() => { setAppUsers(appUsers.filter(x => x.id !== u.id)); addLogEntry('Identity Revoke', `Revoked access for: ${u.name}`); }} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                                         </div>
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                     </div>

                     <div className="col-span-4">
                       <div className="glass-card p-8 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                         <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Lock className="text-blue-500" size={20} /> Security Settings</h3>
                         
                         <div className="space-y-6">
                           <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 flex items-center gap-4 mb-6">
                             <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold bg-blue-600 text-white shadow-lg">{currentUser?.name?.[0]}</div>
                             <div>
                               <p className="text-sm font-bold text-white">{currentUser?.name}</p>
                               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{currentUser?.role}</p>
                             </div>
                           </div>

                           <div className="space-y-4">
                             <div className="space-y-2">
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Current Password</label>
                               <input 
                                type="password" 
                                value={passwordChange.current}
                                onChange={e => setPasswordChange({...passwordChange, current: e.target.value})}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all" 
                               />
                             </div>
                             <div className="space-y-2">
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                               <input 
                                type="password" 
                                value={passwordChange.new}
                                onChange={e => setPasswordChange({...passwordChange, new: e.target.value})}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all" 
                               />
                             </div>
                             <div className="space-y-2">
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                               <input 
                                type="password" 
                                value={passwordChange.confirm}
                                onChange={e => setPasswordChange({...passwordChange, confirm: e.target.value})}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all" 
                               />
                             </div>
                             
                             <button 
                              onClick={() => {
                                if (passwordChange.new !== passwordChange.confirm) {
                                  alert('Passwords do not match!');
                                  return;
                                }
                                if (passwordChange.new.length < 8) {
                                  alert('Password must be at least 8 characters.');
                                  return;
                                }
                                // In a real app, verify current password and call API
                                setShowPasswordSuccess(true);
                                setPasswordChange({ current: '', new: '', confirm: '' });
                                addLogEntry('Security Update', `Password changed for ${currentUser?.name}`);
                                setTimeout(() => setShowPasswordSuccess(false), 3000);
                              }}
                              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl text-xs font-bold transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                             >
                               Update Password
                             </button>

                             <AnimatePresence>
                               {showPasswordSuccess && (
                                 <motion.div 
                                  initial={{ opacity: 0, y: 10 }} 
                                  animate={{ opacity: 1, y: 0 }} 
                                  exit={{ opacity: 0 }}
                                  className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-green-500 text-[10px] font-bold uppercase tracking-wider justify-center"
                                 >
                                   <CheckCircle size={14} /> Password Updated Successfully
                                 </motion.div>
                               )}
                             </AnimatePresence>
                           </div>
                           
                           <div className="pt-4">
                             <button 
                              onClick={() => { setIsAuthenticated(false); setCurrentUser(null); }}
                              className="w-full border border-red-500/30 hover:bg-red-500/10 text-red-500 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                             >
                               <LogOut size={14} /> Terminate Session
                             </button>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                </div>
             )}
             {activeTab === 'settings' && (
                <div className="animate-fade-in space-y-8 max-w-5xl">
                   <h2 className="text-3xl font-bold text-white">Global Taxonomy</h2>
                   <div className="grid grid-cols-3 gap-8">
                      <div className="glass-card p-6 rounded-2xl border border-slate-800 shadow-xl">
                         <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold text-white flex items-center gap-2"><Building size={18} className="text-blue-500" /> Business Units</h3><button onClick={() => setShowTagModal({ type: 'BUs' })} className="text-blue-500 hover:text-blue-400 transition-colors"><Plus size={20} /></button></div>
                         <div className="space-y-2">{tags.BUs.map(bu => <div key={bu} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl group transition-all hover:border-blue-500/30"><span className="text-xs text-slate-300 font-medium">{bu}</span><button onClick={() => setTags({...tags, BUs: tags.BUs.filter(x => x !== bu)})} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 transition-opacity"><X size={14} /></button></div>)}</div>
                      </div>
                      <div className="glass-card p-6 rounded-2xl border border-slate-800 shadow-xl">
                         <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold text-white flex items-center gap-2"><Layers size={18} className="text-purple-500" /> Departments</h3><button onClick={() => setShowTagModal({ type: 'Depts' })} className="text-purple-500 hover:text-purple-400 transition-colors"><Plus size={20} /></button></div>
                         <div className="space-y-2">{tags.Depts.map(d => <div key={d} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl group transition-all hover:border-purple-500/30"><span className="text-xs text-slate-300 font-medium">{d}</span><button onClick={() => setTags({...tags, Depts: tags.Depts.filter(x => x !== d)})} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 transition-opacity"><X size={14} /></button></div>)}</div>
                      </div>
                      <div className="glass-card p-6 rounded-2xl border border-slate-800 shadow-xl">
                         <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold text-white flex items-center gap-2"><Tag size={18} className="text-amber-500" /> Categories</h3><button onClick={() => setShowTagModal({ type: 'Categories' })} className="text-amber-500 hover:text-amber-400 transition-colors"><Plus size={20} /></button></div>
                         <div className="space-y-2">{tags.Categories.map(c => <div key={c} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl group transition-all hover:border-amber-500/30"><span className="text-xs text-slate-300 font-medium">{c}</span><button onClick={() => setTags({...tags, Categories: tags.Categories.filter(x => x !== c)})} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 transition-opacity"><X size={14} /></button></div>)}</div>
                      </div>
                   </div>
                </div>
             )}
             {activeTab === 'audit' && (
                <div className="animate-fade-in space-y-8">
                   <h2 className="text-3xl font-bold text-white flex items-center gap-3"><Terminal className="text-blue-500" /> Forensic Audit Trail</h2>
                   <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                      <table className="w-full text-left text-sm">
                         <thead className="bg-slate-900/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                            <tr><th className="px-6 py-4">Event Time</th><th className="px-6 py-4">Actor</th><th className="px-6 py-4">Action Type</th><th className="px-6 py-4 text-right">Details</th></tr>
                         </thead>
                         <tbody className="divide-y divide-slate-800 font-mono">
                            {auditLog.map(log => (
                               <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                                  <td className="px-6 py-4 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                                  <td className="px-6 py-4 text-white font-bold">{log.userName}</td>
                                  <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-[10px] uppercase font-bold tracking-tighter border border-blue-500/20">{log.action}</span></td>
                                  <td className="px-6 py-4 text-right text-slate-400 italic text-xs">{log.details}</td>
                               </tr>
                            ))}
                            {auditLog.length === 0 && <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-600 italic">No system telemetry recorded yet.</td></tr>}
                         </tbody>
                      </table>
                   </div>
                </div>
             )}
             {activeTab === 'contract' && (
                <div className="grid grid-cols-12 gap-8 h-full animate-fade-in">
                   <div className="col-span-8 flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                         <div>
                            <h2 className="text-2xl font-bold text-white mb-1">{currentContract?.title || 'Contract Workspace'}</h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{currentContract?.status} • {currentContract?.lastModifiedBy}</p>
                         </div>
                         <div className="flex gap-3">
                            <button onClick={saveContract} className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition-all shadow-lg" title="Save Draft"><Save size={18} /></button>
                            <button onClick={() => setIsDiffMode(!isDiffMode)} title="Toggle Redlining" className={`p-2 rounded-lg transition-all shadow-lg ${isDiffMode ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><FileDiff size={18} /></button>
                            <button onClick={() => {
                               setIsAISummarizing(true);
                               setTimeout(() => { setAiSummary("Intelligence Report: 100% clause alignment detected for Standard Vendor Terms. No anomalous risk signatures found in Section 2. Governing Law matches Singapore standard. Recommendation: Proceed to final signature."); setIsAISummarizing(false); addLogEntry('AI Analysis', `Generated deep summary for ${currentContract?.title}`); }, 1500);
                            }} className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all active:scale-95">
                               {isAISummarizing ? <RotateCcw size={14} className="animate-spin" /> : <BrainCircuit size={14} />} Smart Summarize
                            </button>
                         </div>
                      </div>
                      {aiSummary && (
                         <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-purple-950/20 border border-purple-500/30 rounded-[2rem] relative overflow-hidden group shadow-2xl backdrop-blur-sm">
                            <button onClick={() => setAiSummary(null)} className="absolute top-6 right-6 text-slate-600 hover:text-white transition-colors"><X size={18} /></button>
                            <div className="flex items-center gap-2 mb-4"><Sparkles size={16} className="text-purple-400 animate-pulse" /><span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Autonomous Intelligence Report</span></div>
                            <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-medium">{aiSummary}</div>
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
                         </motion.div>
                      )}
                      <div className="glass-card rounded-[2.5rem] border border-slate-800 flex-1 relative overflow-hidden bg-slate-900/10 min-h-[600px] shadow-2xl flex flex-col">
                         {isDiffMode ? (
                            <div className="flex-1 p-12 overflow-y-auto whitespace-pre-wrap font-mono text-lg leading-relaxed text-slate-300 scrollbar-hide">{renderRedlines(versions?.[0]?.content || "", contractContent)}</div>
                         ) : (
                            <textarea value={contractContent} onChange={(e) => setContractContent(e.target.value)} className="w-full h-full p-12 bg-transparent border-none outline-none resize-none text-slate-300 font-mono text-lg leading-relaxed placeholder-slate-700 scrollbar-hide" placeholder="Start drafting or use Smart Suggest to populate content..." />
                         )}
                         <div className="h-12 border-t border-slate-800 bg-slate-950/50 px-8 flex items-center justify-between">
                            <div className="flex gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest"><span>Lines: {contractContent.split('\n').length}</span><span>Words: {contractContent.split(' ').length}</span></div>
                            <div className="flex gap-2 items-center"><ShieldCheck size={14} className="text-green-500" /><span className="text-[10px] font-bold text-green-500 uppercase">Secure Version Active</span></div>
                         </div>
                      </div>
                   </div>
                   <div className="col-span-4 space-y-6">
                      <div className="glass-card p-8 rounded-[2rem] border border-slate-800 shadow-xl bg-slate-900/5">
                         <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Tag size={14} /> Contract Metadata</h3>
                         <div className="space-y-6">
                            <div className="space-y-2"><label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest ml-1">Lifecycle Status</label><select value={currentContract?.status} onChange={(e) => currentContract && setCurrentContract({...currentContract, status: e.target.value as any})} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 outline-none focus:ring-1 focus:ring-purple-500 transition-all font-bold"><option value="Draft">Draft</option><option value="Review">In Review</option><option value="Live">Live / Executed</option><option value="In Queue">Queued</option></select></div>
                            <div className="space-y-2"><label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest ml-1">Business Unit</label><select value={currentContract?.businessUnit} onChange={(e) => currentContract && setCurrentContract({...currentContract, businessUnit: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 outline-none focus:ring-1 focus:ring-purple-500 transition-all">{tags.BUs.map(bu => <option key={bu} value={bu}>{bu}</option>)}</select></div>
                            <div className="space-y-2"><label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest ml-1">Department</label><select value={currentContract?.department} onChange={(e) => currentContract && setCurrentContract({...currentContract, department: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 outline-none focus:ring-1 focus:ring-purple-500 transition-all">{tags.Depts.map(dept => <option key={dept} value={dept}>{dept}</option>)}</select></div>
                            <div className="space-y-2"><label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest ml-1">Document Category</label><select value={currentContract?.category} onChange={(e) => currentContract && setCurrentContract({...currentContract, category: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 outline-none focus:ring-1 focus:ring-purple-500 transition-all">{tags.Categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                         </div>
                      </div>
                      <div className="glass-card p-8 rounded-[2rem] border-l-4 border-l-purple-500 bg-purple-500/5 shadow-2xl relative overflow-hidden">
                         <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Sparkles className="text-purple-400" size={20} /> Smart Remediation</h3>
                         <div className="space-y-5 relative z-10">
                            {conflicts.map((c, i) => {
                               const p = playbook.find(x => x.id === c.clauseId);
                               return (
                                 <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="p-5 bg-slate-950/80 border border-purple-500/20 rounded-2xl space-y-3 transition-all hover:border-purple-500/50 group/item shadow-lg">
                                   <div className="flex justify-between items-start"><h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{p?.title}</h4><AlertTriangle size={12} className="text-amber-500 animate-pulse" /></div>
                                   <p className="text-[10px] text-slate-400 italic leading-relaxed">Language deviates from standard playbook benchmarks.</p>
                                   <button onClick={() => { if(p) { setContractContent(contractContent.replace(p.title, `${p.title}\n\n${p.preferredLanguage}`)); addLogEntry('AI Remediation', `Autonomous fix applied to ${p.title}`); } }} className="w-full py-2.5 bg-purple-600/90 hover:bg-purple-600 text-white text-[10px] font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2">Apply Smart Fix <Wand2 size={12} /></button>
                                 </motion.div>
                               );
                            })}
                            {conflicts.length === 0 && (
                               <div className="text-center py-12 space-y-4 opacity-70"><CheckCircle className="mx-auto text-green-500" size={40} /><p className="text-xs text-slate-400 italic font-medium tracking-wide">Document is fully standardized.</p></div>
                            )}
                         </div>
                         <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                      </div>
                   </div>
                </div>
             )}
          </AnimatePresence>
        </main>
      </div>

      {/* --- Modals --- */}
      <AnimatePresence>
        {showUserModal && editingUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617]/90 backdrop-blur-md p-8">
            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-12 w-full max-w-xl shadow-2xl space-y-10 border-t-4 border-t-blue-600 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
              <div className="space-y-2 relative z-10"><h3 className="text-3xl font-bold text-white tracking-tight">Identity Provisioning</h3><p className="text-sm text-slate-500 font-medium">Define access hierarchy and operational role.</p></div>
              <div className="grid grid-cols-2 gap-8 relative z-10">
                 <div className="space-y-3"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Legal Name</label><input type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-blue-600/50 outline-none transition-all shadow-inner" /></div>
                 <div className="space-y-3"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Organizational Role</label><input type="text" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-blue-600/50 outline-none transition-all shadow-inner" /></div>
                 <div className="space-y-3 col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label><input type="email" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-blue-600/50 outline-none transition-all shadow-inner" placeholder="name@lexguard.ai" /></div>
              </div>

              <div className="flex justify-end gap-6 pt-6 relative z-10">
                 <button onClick={() => setShowUserModal(false)} className="text-slate-500 hover:text-white font-bold px-4 transition-colors">Discard changes</button>
                 <button onClick={() => {
                   if (appUsers.find(x => x.id === editingUser.id)) {
                     setAppUsers(appUsers.map(x => x.id === editingUser.id ? (editingUser as User) : x));
                   } else {
                     setAppUsers([...appUsers, editingUser as User]);
                   }
                   setShowUserModal(false);
                   addLogEntry('Identity Protocol', `Provisioned identity for: ${editingUser.name}`);
                 }} className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-4 rounded-2xl font-bold shadow-xl shadow-blue-900/40 transition-all active:scale-95">Finalize Provisioning</button>
              </div>
            </div>
          </motion.div>
        )}
        
        {showPlaybookModal && editingClause && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617]/90 backdrop-blur-md p-8">
            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-12 w-full max-w-3xl shadow-2xl space-y-10 border-t-4 border-t-purple-600 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
              <div className="space-y-2 relative z-10"><h3 className="text-3xl font-bold text-white tracking-tight">Clause Encoding</h3><p className="text-sm text-slate-500 font-medium">Establish canonical legal standards for autonomous matching.</p></div>
              <div className="space-y-4 relative z-10"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Functional Clause Title</label><input type="text" value={editingClause.title} onChange={e => setEditingClause({...editingClause, title: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-8 py-5 text-sm text-white outline-none focus:ring-2 focus:ring-purple-600/50 transition-all shadow-inner font-bold" placeholder="e.g. Limitation of Liability" /></div>
              <div className="space-y-4 relative z-10"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Canonical Language Schema</label><textarea value={editingClause.preferredLanguage} onChange={e => setEditingClause({...editingClause, preferredLanguage: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-8 py-5 text-sm text-white font-mono h-48 outline-none focus:ring-2 focus:ring-purple-600/50 transition-all resize-none shadow-inner leading-relaxed" placeholder="Enter standard language..." /></div>
              <div className="flex justify-end gap-6 pt-4 relative z-10">
                 <button onClick={() => setShowPlaybookModal(false)} className="text-slate-500 hover:text-white font-bold px-4 transition-colors">Abort setup</button>
                 <button onClick={() => {
                   if (playbook.find(x => x.id === editingClause.id)) {
                     setPlaybook(playbook.map(x => x.id === editingClause.id ? (editingClause as PlaybookClause) : x));
                   } else {
                     setPlaybook([...playbook, editingClause as PlaybookClause]);
                   }
                   setShowPlaybookModal(false);
                   addLogEntry('Protocol Update', `Clause baseline updated: ${editingClause.title}`);
                 }} className="bg-purple-600 hover:bg-purple-500 text-white px-12 py-4 rounded-2xl font-bold shadow-xl shadow-purple-900/40 transition-all active:scale-95">Commit Baseline</button>
              </div>
            </div>
          </motion.div>
        )}

        {showTagModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617]/95 backdrop-blur-2xl p-8">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-12 w-full max-w-sm shadow-2xl space-y-10 border-b-4 border-b-blue-600">
               <div className="space-y-1"><h3 className="text-2xl font-bold text-white tracking-tight">{showTagModal.original ? 'Tag Refinement' : 'New Tag Protocol'}</h3><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Taxonomy System</p></div>
               <input type="text" value={showTagModal.value || ''} onChange={e => setShowTagModal({...showTagModal, value: e.target.value})} placeholder="Tag identifier..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-5 text-sm text-white focus:ring-2 focus:ring-blue-600/50 outline-none transition-all shadow-inner" autoFocus />
               <div className="flex justify-end gap-6 pt-2">
                  <button onClick={() => setShowTagModal(null)} className="text-slate-500 hover:text-white font-bold transition-colors">Discard</button>
                  <button onClick={() => {
                    const list = tags[showTagModal.type];
                    let next;
                    if (showTagModal.original) {
                      next = list.map(x => x === showTagModal.original ? showTagModal.value! : x);
                    } else {
                      next = [...list, showTagModal.value!];
                    }
                    setTags({...tags, [showTagModal.type]: next});
                    addLogEntry('Taxonomy Sync', `New tag established: ${showTagModal.value}`);
                    setShowTagModal(null);
                  }} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-blue-900/40 transition-all active:scale-95">Apply Tag</button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
