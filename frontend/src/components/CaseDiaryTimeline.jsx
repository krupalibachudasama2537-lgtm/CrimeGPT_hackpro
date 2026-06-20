import React, { useState } from 'react';
import {
  FileText, Calendar, Plus, Clock, Shield, Sparkles,
  User, CheckCircle, Scale, ShieldAlert, Heart, Trash2
} from 'lucide-react';

export default function CaseDiaryTimeline({ caseData, setCaseData, translations, lang }) {
  const t = translations[lang];
  const [customText, setCustomText] = useState('');

  // Add custom log entry
  const handleAddCustomLog = (eventText, customType = 'custom') => {
    if (!eventText) return;
    const now = new Date();
    const newLog = {
      id: Date.now(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: now.toISOString().split('T')[0],
      event: eventText,
      type: customType
    };
    setCaseData(prev => ({
      ...prev,
      timeline: [...prev.timeline, newLog]
    }));
    setCustomText('');
  };

  // Icon selector based on action type
  const getTimelineIcon = (type) => {
    switch (type) {
      case 'complaint':
        return <FileText className="w-4 h-4 text-amber-500" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'seizure':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'seizure_del':
        return <Trash2 className="w-4 h-4 text-red-400" />;
      case 'witness':
        return <User className="w-4 h-4 text-sky-400" />;
      case 'arrest':
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case 'medical':
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'magistrate':
        return <Scale className="w-4 h-4 text-indigo-400" />;
      case 'document':
        return <FileText className="w-4 h-4 text-police-khaki" />;
      default:
        return <Shield className="w-4 h-4 text-slate-400" />;
    }
  };

  // Color mapping based on action type for background dots
  const getDotColors = (type) => {
    switch (type) {
      case 'complaint':
        return 'bg-amber-500/10 border-amber-500/50';
      case 'ai':
        return 'bg-purple-500/10 border-purple-500/50';
      case 'seizure':
        return 'bg-emerald-500/10 border-emerald-500/50';
      case 'witness':
        return 'bg-sky-500/10 border-sky-500/50';
      case 'arrest':
        return 'bg-red-500/10 border-red-500/50';
      case 'medical':
        return 'bg-rose-500/10 border-rose-500/50';
      case 'magistrate':
        return 'bg-indigo-500/10 border-indigo-500/50';
      case 'document':
        return 'bg-police-khaki/10 border-police-khaki/50';
      default:
        return 'bg-slate-700 border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-police-khaki flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {t.timelineTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-1">{t.timelineSubtitle}</p>
          </div>
          <div className="text-xs bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-full text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Total Logs: {caseData.timeline.length}
          </div>
        </div>

        {/* Quick action buttons for typical milestones */}
        <div className="mb-8 p-4 bg-slate-900/40 rounded-xl border border-slate-700/30">
          <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Quick Police Diary Milestones</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAddCustomLog(`Accused ${caseData.accused.name} formally declared arrested at ${caseData.accused.arrestTime} under Sec 35 BNSS.`, 'arrest')}
              className="bg-red-950/40 hover:bg-red-900/30 text-red-300 border border-red-900/50 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Arrest Accused
            </button>
            <button
              onClick={() => handleAddCustomLog(`Accused escorted for mandatory medical checkup at Civil Hospital under Sec 53 BNSS. Report appended.`, 'medical')}
              className="bg-rose-950/40 hover:bg-rose-900/30 text-rose-300 border border-rose-900/50 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <Heart className="w-3.5 h-3.5" /> Medical Checkup
            </button>
            <button
              onClick={() => handleAddCustomLog(`Escorted accused before Chief Metropolitan Magistrate requesting 14 days police remand.`, 'magistrate')}
              className="bg-indigo-950/40 hover:bg-indigo-900/30 text-indigo-300 border border-indigo-900/50 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <Scale className="w-3.5 h-3.5" /> Present in Court
            </button>
            <button
              onClick={() => handleAddCustomLog(`Seizure panchanama executed at search location in presence of witnesses.`, 'seizure')}
              className="bg-emerald-950/40 hover:bg-emerald-900/30 text-emerald-300 border border-emerald-900/50 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Panchanama Done
            </button>
          </div>
        </div>

        {/* Timeline Core */}
        <div className="relative pl-8 timeline-line space-y-6">
          {caseData.timeline.map((log, idx) => (
            <div key={log.id} className="relative group animate-fadeIn">
              {/* Vertical timeline node indicator */}
              <div className={`absolute -left-[27px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-slate-900 ${getDotColors(log.type)} z-10 shadow-sm`}>
                {getTimelineIcon(log.type)}
              </div>

              {/* Log bubble content */}
              <div className="bg-slate-900/40 hover:bg-slate-900/70 border border-slate-700/40 hover:border-slate-600 p-4 rounded-xl transition-all shadow-md">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] font-bold text-police-khaki bg-police-navy border border-police-khaki/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">{log.type}</span>
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <span className="font-semibold">{log.date}</span>
                    <span>•</span>
                    <span>{log.time}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-200 mt-2 font-medium leading-relaxed">{log.event}</p>
              </div>
            </div>
          ))}

          {caseData.timeline.length === 0 && (
            <div className="text-center text-slate-500 italic py-10">Timeline empty. Log events dynamically or add manual entries above.</div>
          )}
        </div>

        {/* Manual Timeline Input Form */}
        <div className="mt-8 pt-6 border-t border-slate-700/60">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t.addLogPlaceholder}
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-police-khaki"
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddCustomLog(customText, 'custom');
              }}
            />
            <button
              onClick={() => handleAddCustomLog(customText, 'custom')}
              disabled={!customText}
              className={`btn-police-primary px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 ${!customText ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Plus className="w-4 h-4 text-slate-900" />
              {t.btnCustomLog}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
