import React, { useState, useEffect, useRef } from 'react';
import { 
  Scale, BrainCircuit, Calendar, FileText, Users, CheckCircle, 
  Languages, Shield, FileSpreadsheet, UserCheck, AlertTriangle, 
  Clock, ShieldAlert, Heart, ClipboardCheck, Network, BarChart3 
} from 'lucide-react';
import { initialCaseData, translations } from './data/mockData';
import UnifiedDataPool from './components/UnifiedDataPool';
import AILegalIntelligence from './components/AILegalIntelligence';
import CaseDiaryTimeline from './components/CaseDiaryTimeline';
import DocumentEngine from './components/DocumentEngine';
import LoginRegister from './components/LoginRegister';
import KnowledgeGraph from './components/KnowledgeGraph';
import HotspotAnalytics from './components/HotspotAnalytics';
import ErrorBoundary from './components/ErrorBoundary';
import { authAPI, casesAPI } from './services/api';
import { useAuthStore } from './stores/useAuthStore';
import { useCaseStore } from './stores/useCaseStore';
import { 
  connectSocket, disconnectSocket, joinCase, leaveCase, 
  subscribeToFieldEdited, subscribeToNotificationReceived,
  emitNotification
} from './services/socket';

export default function App() {
  const lang = useAuthStore(state => state.lang);
  const setLang = useAuthStore(state => state.setLang);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);
  
  const cases = useCaseStore(state => state.cases);
  const activeCase = useCaseStore(state => state.activeCase);
  const fetchCases = useCaseStore(state => state.fetchCases);
  const updateCase = useCaseStore(state => state.updateCase);
  const isOfflineMode = useCaseStore(state => state.isOfflineMode);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeRole, setActiveRole] = useState('io');
  const [isInitializing, setIsInitializing] = useState(true);
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const isLocalEditRef = useRef(false);

  // Real-time collaboration & alerts
  const [activeEditors, setActiveEditors] = useState({});
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Helper to calculate statutory deadlines
  const calculateRemaining = (dueDateStr) => {
    if (!dueDateStr) return { text: 'No Date', colorClass: 'text-slate-400', isCritical: false };
    const dueDate = new Date(dueDateStr);
    if (isNaN(dueDate.getTime())) {
      return { text: dueDateStr, colorClass: 'text-slate-400', isCritical: false };
    }
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      const overdueDays = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      return {
        text: `OVERDUE by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}`,
        colorClass: 'text-red-500 font-extrabold animate-pulse',
        isCritical: true,
        days: -overdueDays
      };
    }

    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    let colorClass = 'text-emerald-400 font-bold';
    let isCritical = false;

    if (diffDays < 7) {
      colorClass = 'text-red-500 font-extrabold animate-pulse';
      isCritical = true;
    } else if (diffDays <= 30) {
      colorClass = 'text-yellow-500 font-bold';
    }

    return {
      text: `${diffDays} day${diffDays !== 1 ? 's' : ''} ${hours} hr${hours !== 1 ? 's' : ''} remaining`,
      colorClass,
      isCritical,
      days: diffDays
    };
  };

  // Map caseData to activeCase or fall back to mock seed
  const caseData = activeCase || {
    ...initialCaseData,
    flaggedSections: "303, 305, 331 BNS",
    timeline: []
  };

  const setCaseData = (updater) => {
    isLocalEditRef.current = true;
    const resolved = typeof updater === 'function' ? updater(caseData) : updater;
    useCaseStore.setState({ activeCase: resolved });
  };

  const updateCaseData = (newData) => {
    setCaseData(newData);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseCoords({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 1. Session restoration & preloading Case Data on mount
  useEffect(() => {
    const restoreSession = async () => {
      await useAuthStore.getState().initializeAuth();
      setIsInitializing(false);
    };
    restoreSession();
  }, []);

  // 2. Load cases list when logged in
  useEffect(() => {
    if (isAuthenticated) {
      fetchCases();
    }
  }, [isAuthenticated, fetchCases]);

  // Set initial active role based on user role
  useEffect(() => {
    if (user?.role) {
      setActiveRole(user.role);
    }
  }, [user]);

  // 3. Debounced Auto-Save Case State to MongoDB
  useEffect(() => {
    if (isInitializing || !isAuthenticated || !caseData._id) return;
    if (!isLocalEditRef.current) return;

    const autoSaveTimeout = setTimeout(async () => {
      try {
        isLocalEditRef.current = false; // Reset before saving
        await updateCase(caseData._id, caseData);
        console.log("Case auto-synced to backend successfully.");
      } catch (err) {
        console.error("Failed to auto-sync case to backend:", err);
      }
    }, 1200); // 1.2s debounce

    return () => clearTimeout(autoSaveTimeout);
  }, [caseData, isAuthenticated, isInitializing, updateCase]);

  // 4. Socket.io Live Collaboration Integration
  useEffect(() => {
    if (isAuthenticated && token && caseData?._id) {
      const socket = connectSocket(token);

      joinCase(caseData._id);

      // Subscribe to field edits
      const unsubFieldEdited = subscribeToFieldEdited(({ officerName, field, value }) => {
        showToast(`Officer ${officerName} edited field: ${field}`, 'info');

        setActiveEditors(prev => ({
          ...prev,
          [field]: { officerName, timestamp: Date.now() }
        }));

        // Update activeCase inside useCaseStore
        useCaseStore.setState(state => {
          if (state.activeCase && state.activeCase._id === caseData._id) {
            const updatedCase = { ...state.activeCase };
            if (field.includes('.')) {
              const [section, subField] = field.split('.');
              updatedCase[section] = {
                ...updatedCase[section],
                [subField]: value
              };
            } else {
              updatedCase[field] = value;
            }
            return {
              activeCase: updatedCase,
              cases: state.cases.map(c => c._id === updatedCase._id ? updatedCase : c)
            };
          }
          return {};
        });
      });

      // Subscribe to custom collaboration notifications
      const unsubNotification = subscribeToNotificationReceived(({ message, type }) => {
        showToast(message, type);
      });

      return () => {
        leaveCase(caseData._id);
        unsubFieldEdited();
        unsubNotification();
        disconnectSocket();
      };
    }
  }, [isAuthenticated, token, caseData?._id]);

  // 5. Toast notification on app load if any deadline is within 48 hours
  useEffect(() => {
    if (isAuthenticated && caseData?.deadlines?.length > 0) {
      const criticalDeadlines = caseData.deadlines.filter(dl => {
        const { days } = calculateRemaining(dl.dueDate);
        return days !== undefined && days >= 0 && days <= 2;
      });
      
      if (criticalDeadlines.length > 0) {
        criticalDeadlines.forEach(dl => {
          showToast(`⚠️ Critical Deadline: "${dl.title}" is due in less than 48 hours!`, 'warning');
        });
      }
    }
  }, [isAuthenticated, caseData?.deadlines]);

  const handleLoginSuccess = async (loggedInUser) => {
    console.log("Login successful, profile loaded:", loggedInUser);
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
  };

  const t = translations?.[lang] || translations?.en || {};
  // Helper to switch language (fallback toggle, though navbar uses segmented buttons now)
  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'hi' : lang === 'hi' ? 'gu' : 'en';
    setLang(nextLang);
  };

  // Helper to get active tab css
  const tabClass = (tabId) => {
    const base = "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all ";
    if (activeTab === tabId) {
      return base + "bg-police-khaki text-slate-950 shadow-md font-extrabold";
    }
    return base + "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200";
  };

  // Render Dashboard Home Tab
  const renderDashboardHome = () => {
    // Check deadlines urgency and counts
    const deadlinesList = caseData.deadlines || [];

    return (
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-xl shadow-md flex items-center gap-4">
            <div className="bg-red-500/10 border border-red-500/30 w-12 h-12 rounded-lg flex items-center justify-center text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.statusLabel}</div>
              <div className="text-sm font-black text-slate-200 mt-0.5">{caseData.accused.status.split('(')[0]}</div>
              <p className="text-[10px] text-red-400/80 font-medium">Arrested: {caseData.accused.arrestDate || 'Pending'}</p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-xl shadow-md flex items-center gap-4">
            <div className="bg-police-khaki/10 border border-police-khaki/30 w-12 h-12 rounded-lg flex items-center justify-center text-police-khaki">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.secRecommended}</div>
              <div className="text-sm font-black text-slate-200 mt-0.5">{caseData.flaggedSections || "Pending AI"}</div>
              <p className="text-[10px] text-slate-400/80 font-medium">Bharatiya Nyaya Sanhita (BNS)</p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-xl shadow-md flex items-center gap-4">
            <div className="bg-teal-500/10 border border-teal-500/30 w-12 h-12 rounded-lg flex items-center justify-center text-teal-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seized Articles</div>
              <div className="text-sm font-black text-slate-200 mt-0.5">{caseData.seizedItems.length} Seized Items</div>
              <p className="text-[10px] text-teal-400/80 font-medium">Zabti Register Synced</p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-xl shadow-md flex items-center gap-4">
            <div className="bg-sky-500/10 border border-sky-500/30 w-12 h-12 rounded-lg flex items-center justify-center text-sky-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Witness Registry</div>
              <div className="text-sm font-black text-slate-200 mt-0.5">{caseData.witnesses.length} Recorded</div>
              <p className="text-[10px] text-sky-400/80 font-medium">Sec 180 BNSS compliant</p>
            </div>
          </div>
        </div>

        {/* Unified Pool Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-xl shadow-lg lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-police-khaki border-b border-slate-700 pb-2">Active Case Context</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-bold block mb-1">Accused Details</span>
                <span className="text-slate-200 font-extrabold">{caseData.accused.name || 'Absconding'}</span>
                <span className="text-slate-400 block mt-0.5">Age: {caseData.accused.age} | Phone: {caseData.accused.phone}</span>
                <span className="text-slate-400 block truncate">Address: {caseData.accused.address}</span>
              </div>

              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-bold block mb-1">Victim Details</span>
                <span className="text-slate-200 font-extrabold">{caseData.victim.name}</span>
                <span className="text-slate-400 block mt-0.5">Age: {caseData.victim.age} | Phone: {caseData.victim.phone}</span>
                <span className="text-slate-400 block truncate">Injury status: {caseData.victim.injuryStatus}</span>
              </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 font-bold block border-b border-slate-800/50 pb-1">Incident Narrative Summary</span>
              <p className="text-xs text-slate-300 leading-relaxed font-mono line-clamp-3">{caseData.narrative}</p>
              <button 
                onClick={() => setActiveTab('ai')}
                className="text-[10px] text-police-khaki hover:underline font-bold"
              >
                Analyze narrative using RAG AI &rarr;
              </button>
            </div>
          </div>

          {/* Legal Compliance Audit Checklist */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-xl shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-police-khaki border-b border-slate-700 pb-2 flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4" /> BNS/BNSS Compliance Audit
              </h3>
              
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-200">FIR Digitization Complete</div>
                    <div className="text-[10px] text-slate-400">Registered on electronic medium under Sec 173 BNSS.</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-200">Arrest Notice Dispatched</div>
                    <div className="text-[10px] text-slate-400">Family informed under Sec 36 BNSS.</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-200">Seizure Memo Videographed</div>
                    <div className="text-[10px] text-slate-400">Mandatory crime scene videography under Sec 105 BNSS.</div>
                  </div>
                </div>
                {/* Dynamically bind medical checklist from compliance score */}
                {(!caseData.compliance?.missingItems || caseData.compliance.missingItems.some(i => i.toLowerCase().includes('medical'))) ? (
                  <div className="flex items-start gap-2 text-xs">
                    <div className="w-4 h-4 rounded-full border border-amber-500/50 bg-amber-500/10 flex items-center justify-center text-amber-500 font-black shrink-0 mt-0.5">!</div>
                    <div>
                      <div className="font-bold text-slate-200 text-amber-400">Medical Examination Due</div>
                      <div className="text-[10px] text-slate-400">Escort to Civil Hospital within 24 hours of arrest.</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-200">Medical Examination Conducted</div>
                      <div className="text-[10px] text-slate-400">Escorted to Civil Hospital under Sec 53 BNSS.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold">Compliance Score:</span>
              <span className={`border px-2 py-0.5 rounded font-black text-sm ${
                caseData.compliance?.status === 'PASS' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>{caseData.compliance?.score !== undefined ? `${caseData.compliance.score}% (${caseData.compliance.status})` : '88% (Pass)'}</span>
            </div>
          </div>
        </div>

        {/* Phase 11 - Statutory Deadline Tracker Widget */}
        <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-xl shadow-lg space-y-4">
          <h3 className="text-base font-bold text-police-khaki border-b border-slate-700 pb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Statutory Compliance Deadline Tracker (BNSS)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {deadlinesList.map((dl, idx) => {
              const remaining = calculateRemaining(dl.dueDate);
              return (
                <div key={idx} className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{dl.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Due Date: {dl.dueDate}</p>
                    <p className={`text-[10px] mt-0.5 font-bold ${remaining.colorClass}`}>
                      {remaining.text}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-4">
                    <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                      remaining.isCritical ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse' :
                      remaining.colorClass.includes('yellow') ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' :
                      'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    }`} />
                    <span className="text-[9px] font-black uppercase text-slate-300">{dl.status}</span>
                  </div>
                </div>
              );
            })}
            {deadlinesList.length === 0 && (
              <div className="col-span-3 text-center text-xs text-slate-500 italic">No deadlines set. Sync RAG Analysis to establish legal milestones.</div>
            )}
          </div>
        </div>

        {/* Quick Timeline Summary */}
        <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-4">
            <h3 className="text-base font-bold text-police-khaki flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Case Diary Highlights
            </h3>
            <button 
              onClick={() => setActiveTab('timeline')}
              className="text-xs text-police-khaki hover:underline font-bold"
            >
              View full case diary &rarr;
            </button>
          </div>
          <div className="space-y-3">
            {caseData.timeline.slice(-3).reverse().map((log) => (
              <div key={log.id} className="flex gap-4 text-xs border-l-2 border-slate-700 pl-4 relative">
                <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-police-khaki" />
                <div className="text-slate-400 font-semibold w-24 shrink-0">{log.date} {log.time}</div>
                <div className="text-slate-200 font-medium">{log.event}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render Sub-panel container
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardHome();
      case 'pool':
        return <UnifiedDataPool caseData={caseData} setCaseData={updateCaseData} translations={translations} lang={lang} activeEditors={activeEditors} user={user} />;
      case 'ai':
        return (
          <ErrorBoundary>
            <AILegalIntelligence caseData={caseData} setCaseData={updateCaseData} translations={translations} lang={lang} activeEditors={activeEditors} user={user} />
          </ErrorBoundary>
        );
      case 'timeline':
        return <CaseDiaryTimeline caseData={caseData} setCaseData={updateCaseData} translations={translations} lang={lang} />;
      case 'docs':
        return <DocumentEngine caseData={caseData} setCaseData={updateCaseData} translations={translations} lang={lang} activeRole={activeRole} />;
      case 'graph':
        return (
          <ErrorBoundary>
            <KnowledgeGraph caseData={caseData} />
          </ErrorBoundary>
        );
      case 'analytics':
        return <HotspotAnalytics />;
      default:
        return renderDashboardHome();
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-mono text-police-khaki text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-police-khaki border-t-transparent mb-4" />
        <span>BOOTING CRIMEGPT INTERNAL OS...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      
      {/* Global Interactive Cursor Glow Spotlight */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
        style={{
          background: `radial-gradient(400px circle at ${mouseCoords.x}px ${mouseCoords.y}px, rgba(200, 159, 83, 0.08) 0%, rgba(59, 130, 246, 0.04) 40%, transparent 80%)`
        }}
      />

      {!isAuthenticated ? (
        <LoginRegister 
          onLoginSuccess={handleLoginSuccess}
          translations={translations}
          lang={lang}
          setLang={setLang}
        />
      ) : (
        <>
          {/* Top Banner / Header */}
          <header className="bg-police-navy border-b border-slate-800/80 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-50 shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-police-khaki text-slate-950 p-2.5 rounded-lg border border-police-khaki/30 flex items-center justify-center">
                <Scale className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
                  {t.title} <span className="bg-red-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded leading-none">BNS Compliant</span>
                </h1>
                <p className="text-xs text-slate-400 font-semibold">{t.subtitle}</p>
              </div>
            </div>

            {/* Global Case Info Bar */}
            <div className="hidden lg:flex items-center gap-6 bg-police-navy-dark/80 px-4 py-2 rounded-xl border border-slate-700/30 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">{t.caseId}</span>
                <span className="text-slate-200 font-extrabold">{caseData.firNo}</span>
              </div>
              <div className="border-l border-slate-700/50 pl-6">
                <span className="text-slate-400 block font-semibold">{t.policeStation}</span>
                <span className="text-slate-200 font-extrabold truncate max-w-[180px] block">{caseData.station.split(',')[0]}</span>
              </div>
              <div className="border-l border-slate-700/50 pl-6">
                <span className="text-slate-400 block font-semibold">{t.firDate}</span>
                <span className="text-slate-200 font-extrabold">{caseData.dateOfRegistration}</span>
              </div>
            </div>

            {/* Controls: Segmented Language Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-900 border border-slate-700/60 p-0.5 rounded-xl">
                {[
                  { code: 'en', label: 'EN' },
                  { code: 'gu', label: 'ગુ' },
                  { code: 'hi', label: 'हि' }
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      lang === l.code
                        ? 'bg-police-khaki text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:inline-block bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">V2.0 (Prod)</span>
            </div>
          </header>

          {/* Main Core Layout: Sidebar + Content */}
          <div className="flex-1 flex flex-col md:flex-row">
            
            {/* Sidebar Nav */}
            <aside className="w-full md:w-64 bg-police-navy-dark border-r border-slate-800/80 px-4 py-6 flex flex-col justify-between gap-6">
              <div className="space-y-6">
                
                {/* Officer Profile Sidebar */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-police-navy border border-police-khaki/30 w-10 h-10 rounded-full flex items-center justify-center text-police-khaki font-black">
                      {activeRole === 'io' && "IO"}
                      {activeRole === 'sho' && "SH"}
                      {activeRole === 'legal' && "LA"}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">OFFICER ON DUTY</div>
                      <h4 className="text-xs font-black text-slate-200">
                        {activeRole === 'io' && caseData.ioName.split(' ').slice(-2).join(' ')}
                        {activeRole === 'sho' && caseData.shoName.split(' ').slice(-2).join(' ')}
                        {activeRole === 'legal' && caseData.legalAdvisorName.split(' ').slice(-2).join(' ')}
                      </h4>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-semibold truncate max-w-[100px]">{user?.badge || 'Badge ID'}</span>
                    <button 
                      onClick={handleLogout}
                      className="text-red-400 hover:text-red-300 font-bold transition-colors uppercase tracking-wider"
                    >
                      {t.logout}
                    </button>
                  </div>

                  {/* Role-based selection options */}
                  <div className="space-y-1 pt-2 border-t border-slate-800/60">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">{t.roleLabel}</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded border border-slate-800">
                      <button 
                        onClick={() => setActiveRole('io')}
                        className={`py-1 rounded text-[9px] font-bold transition-all ${activeRole === 'io' ? 'bg-police-khaki text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        IO
                      </button>
                      <button 
                        onClick={() => setActiveRole('sho')}
                        className={`py-1 rounded text-[9px] font-bold transition-all ${activeRole === 'sho' ? 'bg-police-khaki text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        SHO
                      </button>
                      <button 
                        onClick={() => setActiveRole('legal')}
                        className={`py-1 rounded text-[9px] font-bold transition-all ${activeRole === 'legal' ? 'bg-police-khaki text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        LEGAL
                      </button>
                    </div>
                  </div>
                </div>

                {/* Navigation Menus */}
                <nav className="space-y-1">
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={tabClass('dashboard')}
                  >
                    <Shield className="w-4 h-4 shrink-0" />
                    <span>{t.dashboard}</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('pool')}
                    className={tabClass('pool')}
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    <span>{t.unifiedPool}</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('ai')}
                    className={tabClass('ai')}
                  >
                    <BrainCircuit className="w-4 h-4 shrink-0" />
                    <span>{t.aiIntelligence}</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('timeline')}
                    className={tabClass('timeline')}
                  >
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{t.timeline}</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('docs')}
                    className={tabClass('docs')}
                  >
                    <FileSpreadsheet className="w-4 h-4 shrink-0" />
                    <span>{t.docs}</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('graph')}
                    className={tabClass('graph')}
                  >
                    <Network className="w-4 h-4 shrink-0 text-police-khaki" />
                    <span>Knowledge Graph</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('analytics')}
                    className={tabClass('analytics')}
                  >
                    <BarChart3 className="w-4 h-4 shrink-0 text-teal-400" />
                    <span>Hotspot Analytics</span>
                  </button>
                </nav>
              </div>

              {/* Station details */}
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                <span className="font-extrabold uppercase block text-slate-500">Jurisdiction</span>
                <span className="font-bold text-slate-300 block">{caseData.station}</span>
                <span className="text-slate-500 block pt-1">District: {caseData.district}</span>
                <span className="text-slate-500 block">System status: Online</span>
              </div>
            </aside>

            {/* Content Panel Area */}
            <main className="flex-1 bg-slate-900/40 p-6 md:p-8 overflow-y-auto">
              <div className="max-w-6xl mx-auto">
                {renderActiveTabContent()}
              </div>
            </main>
          </div>

          {/* Footer */}
          <footer className="bg-police-navy-dark/95 border-t border-slate-800 text-[10px] text-slate-400 py-3 text-center animate-pulse">
            CrimeGPT Internal Platform • Built strictly compliant with Bharatiya Nyaya Sanhita (BNS, 2023) standards • State Police Dept.
          </footer>
        </>
      )}

      {/* Floating Toast Center */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border flex items-start gap-3 animate-pop-in ${
              t.type === 'error' ? 'bg-red-950/90 text-red-200 border-red-500/30' :
              t.type === 'warning' ? 'bg-amber-950/90 text-amber-200 border-amber-500/30' :
              t.type === 'success' ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30' :
              'bg-police-navy/90 text-slate-100 border-slate-700/60'
            }`}
          >
            <div className="flex-1 text-xs font-bold leading-relaxed">{t.message}</div>
            <button 
              onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
              className="text-slate-400 hover:text-slate-200 text-xs font-black"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
