import React, { useState, useRef } from 'react';
import { 
  Sparkles, BrainCircuit, BookOpen, AlertCircle, FileText, CheckCircle, 
  Scale, Mic, MicOff, Upload, FileCode, CheckCircle2, AlertTriangle, ShieldAlert 
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import { aiAPI } from '../services/api';
import { emitFieldEdit } from '../services/socket';
import OCRUploader from './OCRUploader';
import ContradictionDetector from './ContradictionDetector';

export default function AILegalIntelligence({ caseData, setCaseData, translations, lang, activeEditors, user }) {
  const t = (translations && lang && translations[lang]) ? translations[lang] : (translations ? translations['en'] : {});
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  
  // RAG and Streaming States
  const [retrievedSources, setRetrievedSources] = useState([]);
  const [loadingStep, setLoadingStep] = useState(null); // 'retrieving' | 'generating' | null
  const [aiReasoning, setAiReasoning] = useState('');
  
  // Voice Input States
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // OCR Upload States
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrTextPreview, setOcrTextPreview] = useState('');

  // Compliance Audit & Contradiction States
  const [auditLoading, setAuditLoading] = useState(false);
  const [contradictionLoading, setContradictionLoading] = useState(false);

  const handleNarrativeChange = (e) => {
    const text = e.target.value;
    setCaseData(prev => ({
      ...prev,
      narrative: text
    }));
    if (caseData?._id) {
      emitFieldEdit(caseData._id, user?.name || 'Officer', 'narrative', text);
    }
  };

  // Real Gemini Streaming Analysis (RAG Guided)
  const runAnalysis = async () => {
    if (!caseData.narrative) return;
    
    setAnalyzing(true);
    setResults(null);
    setAiReasoning('');
    setRetrievedSources([]);
    setLoadingStep('retrieving');
    
    try {
      await aiAPI.analyzeNarrativeStream(
        caseData.narrative,
        caseData._id,
        // onChunk callback
        (textChunk) => {
          setLoadingStep('generating');
          setAiReasoning(prev => prev + textChunk);
        },
        // onContext callback (retrieved laws)
        (contextData) => {
          setRetrievedSources(contextData || []);
          setLoadingStep('generating');
        },
        // onResult callback (final parsed JSON object)
        (finalJson) => {
          setResults(finalJson);
          setAnalyzing(false);
          setLoadingStep(null);

          // Update BNS recommended sections in state
          setCaseData(prev => {
            const sectionsList = finalJson.bns.map(item => item.section.split(' ')[1] || item.section).join(', ');
            const updated = {
              ...prev,
              flaggedSections: sectionsList
            };
            
            // Append timeline entry
            updated.timeline = [
              ...prev.timeline,
              {
                id: Date.now(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                date: new Date().toISOString().split('T')[0],
                event: `RAG AI Analysis executed. Category: ${finalJson.bns[0]?.section || 'BNS'}.`,
                type: 'ai'
              }
            ];
            return updated;
          });
        },
        // onError callback
        (error) => {
          console.error('Narrative analysis stream failed:', error);
          setAnalyzing(false);
          setLoadingStep(null);
          alert('Analysis failed: ' + (error.message || 'Unknown error'));
        }
      );
    } catch (err) {
      console.error(err);
      setAnalyzing(false);
      setLoadingStep(null);
    }
  };

  // Multilingual Voice Input via Web Speech API
  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Multilingual Speech recognition is not supported in this browser. Please try Chrome/Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    const locales = { en: 'en-IN', hi: 'hi-IN', gu: 'gu-IN' };
    rec.lang = locales[lang] || 'en-IN';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onerror = (e) => {
      console.error('Speech recognition error:', e);
      setIsListening(false);
    };

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      if (transcript) {
        setCaseData(prev => ({
          ...prev,
          narrative: (prev.narrative ? prev.narrative + ' ' : '') + transcript
        }));
      }
    };

    recognitionRef.current = rec;
    rec.start();
  };

  // OCR Document Processing via Tesseract.js
  const handleOcrFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrTextPreview('');

    try {
      // Run Tesseract OCR in Eng + Hin
      const { data: { text } } = await Tesseract.recognize(file, 'eng+hin', {
        logger: m => console.log(m)
      });

      setOcrTextPreview(text);

      // Call Backend to extract structured fields
      const parsedData = await aiAPI.parseOcrText(text);

      setCaseData(prev => {
        const updated = { ...prev };
        if (parsedData.accusedName) updated.accused.name = parsedData.accusedName;
        if (parsedData.accusedAge) updated.accused.age = parsedData.accusedAge;
        if (parsedData.accusedAddress) updated.accused.address = parsedData.accusedAddress;
        if (parsedData.victimName) updated.victim.name = parsedData.victimName;
        if (parsedData.victimAge) updated.victim.age = parsedData.victimAge;
        
        if (parsedData.seizedArticles && parsedData.seizedArticles.length > 0) {
          parsedData.seizedArticles.forEach(item => {
            const exists = updated.seizedItems.some(i => i.name.toLowerCase() === item.name.toLowerCase());
            if (!exists) {
              updated.seizedItems.push({
                id: Date.now() + Math.random(),
                name: item.name,
                description: item.description || 'Extracted via OCR document scan',
                quantity: item.quantity || '1 unit',
                value: '₹ 0',
                verificationStatus: 'Secured'
              });
            }
          });
        }

        updated.timeline.push({
          id: Date.now(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString().split('T')[0],
          event: `OCR Scan executed on file: ${file.name}. Fields auto-filled.`,
          type: 'document'
        });

        return updated;
      });

      alert('Document OCR completed! Auto-filled detected case details.');
    } catch (ocrError) {
      console.error('OCR processing error:', ocrError);
      alert('Failed to extract text from document: ' + ocrError.message);
    } finally {
      setOcrLoading(false);
    }
  };

  // Trigger agentic compliance auditor
  const triggerAuditor = async () => {
    setAuditLoading(true);
    try {
      const auditRes = await aiAPI.auditCase(caseData._id || caseData.firNo);
      setCaseData(prev => ({
        ...prev,
        compliance: auditRes
      }));
      alert(`Audit finished. Score: ${auditRes.score}%`);
    } catch (err) {
      console.error(err);
      alert('Auditor execution failed: ' + err.message);
    } finally {
      setAuditLoading(false);
    }
  };

  // Trigger witness contradiction detector
  const triggerContradictionDetector = async () => {
    if (caseData.witnesses.length === 0) {
      alert('Add at least one witness statement in Case Pool to run comparison.');
      return;
    }
    setContradictionLoading(true);
    try {
      const contData = await aiAPI.checkContradictions(caseData._id || caseData.firNo);
      setCaseData(prev => ({
        ...prev,
        contradictions: contData.contradictions
      }));
      alert(`Contradiction analysis completed. Identified ${contData.contradictions.length} discrepancies.`);
    } catch (err) {
      console.error(err);
      alert('Contradiction check failed: ' + err.message);
    } finally {
      setContradictionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Narrative Entry Box */}
      <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-police-khaki mb-2 flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-police-khaki" />
          {t.aiHeader}
        </h2>
        <p className="text-xs text-slate-400 mb-4 flex items-center gap-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
          <AlertCircle className="w-4 h-4 text-police-khaki shrink-0" />
          {t.aiDisclaimer}
        </p>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-400">
                {t.narrativeLabel}
                {activeEditors?.['narrative'] && (Date.now() - activeEditors['narrative'].timestamp < 6000) && (
                  <span className="text-[9px] text-amber-400 font-extrabold animate-pulse ml-2">
                    ✏️ {activeEditors['narrative'].officerName} is editing...
                  </span>
                )}
              </label>
              
              {/* Multilingual microphone trigger */}
              <button
                onClick={toggleVoiceInput}
                className={`flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1 rounded-full border transition-all ${
                  isListening 
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' 
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-police-khaki'
                }`}
                title="Speak in English, Hindi, or Gujarati"
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-red-400" />
                    <span>Listening ({lang.toUpperCase()})...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-police-khaki" />
                    <span>Voice Input ({lang.toUpperCase()})</span>
                  </>
                )}
              </button>
            </div>
            
            <textarea
              rows="6"
              value={caseData.narrative}
              onChange={handleNarrativeChange}
              placeholder={t.labelNarrativePlaceholder}
              className={`w-full bg-slate-900 border rounded-lg p-3 text-sm text-slate-200 focus:outline-none placeholder-slate-500 leading-relaxed font-mono ${
                activeEditors?.['narrative'] && (Date.now() - activeEditors['narrative'].timestamp < 6000)
                  ? 'border-amber-500 ring-2 ring-amber-500/30 animate-pulse'
                  : 'border-slate-700 focus:border-police-khaki'
              }`}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            
            {/* Tesseract OCR Upload Component */}
            <div className="flex items-center gap-2">
              <label className={`flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-sm ${
                ocrLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}>
                <Upload className="w-3.5 h-3.5 text-police-khaki" />
                <span>{ocrLoading ? 'Extracting Text (OCR)...' : 'Scan Document (OCR)'}</span>
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  className="hidden" 
                  onChange={handleOcrFileSelect}
                  disabled={ocrLoading}
                />
              </label>
              {ocrLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-police-khaki border-t-transparent" />
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={runAnalysis}
                disabled={analyzing || !caseData.narrative}
                className={`flex items-center gap-2 btn-police-primary py-2.5 px-6 rounded-lg text-xs font-bold shadow-md transform hover:scale-[1.01] active:scale-95 transition-all ${
                  (analyzing || !caseData.narrative) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent" />
                    <span>Processing RAG Database...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
                    <span>{t.btnAnalyze}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* OCR Text Preview Panel */}
        {ocrTextPreview && (
          <div className="mt-4 p-4 bg-slate-950/80 border border-slate-700/40 rounded-lg space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
              <span>Extracted OCR Raw Text</span>
              <span className="text-emerald-400">Processed</span>
            </div>
            <pre className="text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-32 p-2 bg-slate-900/60 rounded border border-slate-800">
              {ocrTextPreview}
            </pre>
          </div>
        )}
      </div>

      {/* Streaming Reasoning Live Console */}
      {analyzing && (
        <div className="bg-slate-950 border border-police-khaki/30 p-5 rounded-xl shadow-inner font-mono text-xs text-slate-300 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-police-khaki animate-ping" />
            <span className="text-[10px] font-bold text-police-khaki uppercase tracking-widest">
              {loadingStep === 'retrieving' ? 'RETRIEVING RELEVANT STATUTES (RAG)...' : 'GENERATING LEGAL ANALYSIS (GEMINI)...'}
            </span>
          </div>
          {aiReasoning ? (
            <p className="leading-relaxed whitespace-pre-wrap max-h-[220px] overflow-y-auto">{aiReasoning}</p>
          ) : (
            <span className="text-slate-500 italic">Accessing legal corpus vectors...</span>
          )}
        </div>
      )}

      {/* Analysis Results Display */}
      {results && !analyzing && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 p-5 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-700">
              <div>
                <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Case Classification</p>
                <h3 className="text-lg font-bold text-police-khaki">RAG Extracted Statutory Match</h3>
              </div>
              <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" /> Confidence: {(results.confidence * 100).toFixed(0)}%
              </span>
            </div>

            {/* Statutory Law Section Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* BNS Card */}
              <div className="bg-slate-900/60 border border-slate-700/50 p-4 rounded-xl space-y-3 hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-police-khaki tracking-wider uppercase">Substantive Offenses (BNS)</h4>
                  <Scale className="w-4 h-4 text-police-khaki" />
                </div>
                <div className="space-y-3">
                  {results.bns.map((item, idx) => {
                    const phrase = extractTriggerPhrase(caseData.narrative, item.section);
                    return (
                      <div key={idx} className="bg-slate-800/60 p-2.5 rounded border border-slate-700/40 space-y-2">
                        <div className="flex justify-between items-center text-xs font-extrabold text-slate-200">
                          <span>{item.section}</span>
                          <span className="text-[9px] text-police-khaki bg-police-khaki/10 px-1.5 py-0.2 rounded">
                            {(results.confidence * 100 - idx * 3).toFixed(0)}% Conf
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 leading-relaxed italic border-l border-slate-700/80 pl-2">
                          "{lang === 'hi' ? item.descHi : lang === 'gu' ? item.descGu : item.desc}"
                        </div>
                        {phrase && (
                          <div className="text-[9px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-1.5 rounded font-mono">
                            <span className="font-bold block uppercase text-[7px] text-slate-500">Trigger Phrase from Narrative</span>
                            "{phrase}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BNSS Card */}
              <div className="bg-slate-900/60 border border-slate-700/50 p-4 rounded-xl space-y-3 hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-teal-400 tracking-wider uppercase">Procedural Rules (BNSS)</h4>
                  <FileText className="w-4 h-4 text-teal-400" />
                </div>
                <div className="space-y-3">
                  {results.bnss.map((item, idx) => (
                    <div key={idx} className="bg-slate-800/60 p-2.5 rounded border border-slate-700/40">
                      <div className="text-xs font-extrabold text-slate-200">{item.section}</div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {lang === 'hi' ? item.descHi : lang === 'gu' ? item.descGu : item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BSA Card */}
              <div className="bg-slate-900/60 border border-slate-700/50 p-4 rounded-xl space-y-3 hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-indigo-400 tracking-wider uppercase">Evidence Standards (BSA)</h4>
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="space-y-3">
                  {results.bsa.map((item, idx) => (
                    <div key={idx} className="bg-slate-800/60 p-2.5 rounded border border-slate-700/40">
                      <div className="text-xs font-extrabold text-slate-200">{item.section}</div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {lang === 'hi' ? item.descHi : lang === 'gu' ? item.descGu : item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sources Retrieved Section */}
            {retrievedSources && retrievedSources.length > 0 && (
              <div className="mt-6 p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Sources Retrieved (RAG Legal Database)</h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {Array.from(new Set(retrievedSources.map(s => s.source))).map((source, sIdx) => (
                    <span key={sIdx} className="bg-police-khaki/10 border border-police-khaki/30 text-police-khaki text-[10px] px-2.5 py-1 rounded-md font-mono font-bold">
                      📄 {source}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation & Reasoning */}
            <div className="mt-6 p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Legal Analysis Explanation</h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{results.explanation}</p>
            </div>

            {/* Next Steps / Procedural Recommendations */}
            <div className="mt-6 p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Compliance Recommendations</h4>
              <ul className="list-disc pl-5 text-xs text-slate-300 space-y-1.5">
                {results.procedures.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Auditor & Contradiction Detector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Compliance Auditor Widget */}
        <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start border-b border-slate-700 pb-2 mb-4">
              <h3 className="text-base font-bold text-police-khaki flex items-center gap-1.5 uppercase">
                <CheckCircle2 className="w-4 h-4" /> Agentic Compliance Auditor
              </h3>
              <button 
                onClick={triggerAuditor}
                disabled={auditLoading}
                className="bg-slate-900 hover:bg-slate-950 text-police-khaki border border-police-khaki/30 text-[10px] font-black uppercase px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {auditLoading ? 'Auditing...' : 'Run Audit'}
              </button>
            </div>

            {caseData.compliance?.score !== undefined ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 shadow-md">
                  {/* Animated Progress Ring */}
                  {renderProgressRing(caseData.compliance.score)}
                  
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Compliance Audit Verdict</span>
                    <span className={`text-xs font-black border px-2 py-0.5 rounded uppercase mt-1 inline-block ${
                      caseData.compliance.status === 'PASS' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {caseData.compliance.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Violated Sections & Remediations:</span>
                  {caseData.compliance.missingItems?.length > 0 ? (
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {caseData.compliance.missingItems.map((item, idx) => {
                        const parsed = parseMissingItem(item);
                        return (
                          <div key={idx} className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50 space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-black text-red-400">
                              <span>⚠ {parsed.section} Violated</span>
                            </div>
                            <p className="text-xs text-slate-200 font-semibold">{parsed.missing}</p>
                            <p className="text-[10.5px] text-amber-400 leading-relaxed font-mono">
                              <span className="font-bold uppercase text-[8px] text-slate-500 block">Fix Suggestion</span>
                              {parsed.fix}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/20 p-3 rounded border border-emerald-900/30 font-medium">
                      <CheckCircle className="w-4 h-4" /> Full compliance met. No missing elements detected.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-500 italic py-10">Trigger Compliance Auditor Agent to verify arrest, medical examination, and seizure logs.</div>
            )}
          </div>
        </div>

        {/* Witness Contradiction Detector Widget */}
        <ContradictionDetector caseData={caseData} onUpdateCase={setCaseData} />

      </div>

    </div>
  );
}

// Helper: Extract trigger phrase from narrative based on section keywords
const extractTriggerPhrase = (narrative, section) => {
  if (!narrative) return '';
  const sentences = narrative.split(/[.!?\n]/).map(s => s.trim()).filter(Boolean);
  const lowerSec = section.toLowerCase();
  
  let keywords = [];
  if (lowerSec.includes('303') || lowerSec.includes('305') || lowerSec.includes('theft') || lowerSec.includes('steal')) {
    keywords = ['stole', 'theft', 'took', 'stolen', 'gold', 'laptop', 'escape', 'fled', 'carrying'];
  } else if (lowerSec.includes('331') || lowerSec.includes('trespass') || lowerSec.includes('break') || lowerSec.includes('house-breaking')) {
    keywords = ['broke', 'breaking', 'sliding door', 'balcony', 'entered', 'climbing', 'broken', 'trespass'];
  } else if (lowerSec.includes('105') || lowerSec.includes('videograph') || lowerSec.includes('seizure') || lowerSec.includes('seized')) {
    keywords = ['seized', 'seizure', 'recovered', 'possession', 'rod', 'bangle', 'laptop', 'crowbar'];
  } else if (lowerSec.includes('53') || lowerSec.includes('medical') || lowerSec.includes('hospital') || lowerSec.includes('exam')) {
    keywords = ['medical', 'hospital', 'examination', 'doctor', 'injuries', 'health'];
  } else {
    keywords = ['accused', 'crime', 'investigation', 'guard', 'witness'];
  }
  
  let bestSentence = '';
  let maxMatchCount = 0;
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    let matchCount = 0;
    for (const kw of keywords) {
      if (lowerSentence.includes(kw)) {
        matchCount++;
      }
    }
    if (matchCount > maxMatchCount) {
      maxMatchCount = matchCount;
      bestSentence = sentence;
    }
  }
  
  return bestSentence || sentences[0] || '';
};

// Helper: Parse compliance message to section + fix suggestions
const parseMissingItem = (item) => {
  const text = item.toLowerCase();
  let section = "BNSS Provision";
  let missing = item;
  let fix = "Please complete this step and record it in the case diary.";

  if (text.includes('medical') || text.includes('section 53') || text.includes('sec 53')) {
    section = "Section 53 BNSS";
    missing = "Accused Medical Examination within 24 hours of arrest is missing.";
    fix = "Escort the arrested suspect to the nearest Civil Hospital immediately for a medical exam and log the certificate.";
  } else if (text.includes('videography') || text.includes('section 105') || text.includes('sec 105') || text.includes('seizure')) {
    section = "Section 105 BNSS";
    missing = "Mandatory audio-video recording of search and seizure operations.";
    fix = "Record the scene search digitally using a mobile or camera and register the videography log in the case file.";
  } else if (text.includes('witness') || text.includes('section 180') || text.includes('sec 180')) {
    section = "Section 180 BNSS";
    missing = "Statements of material witnesses have not been recorded.";
    fix = "Summon neighbors or eye-witnesses to record statements under Section 180 BNSS and append them to the witness list.";
  } else if (text.includes('magistrate') || text.includes('remand') || text.includes('section 187') || text.includes('sec 187')) {
    section = "Section 187 BNSS";
    missing = "Production of accused before the Magistrate within 24 hours.";
    fix = "Produce the accused before the Jurisdictional Magistrate within 24 hours for custody remand.";
  }
  
  return { section, missing, fix };
};

// Helper: Render progress ring
const renderProgressRing = (score) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          className="text-slate-700"
          strokeWidth="6"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="48"
          cy="48"
        />
        <circle
          className="text-police-khaki transition-all duration-1000 ease-out"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="48"
          cy="48"
        />
      </svg>
      <span className="absolute text-sm font-black text-slate-200">{score}%</span>
    </div>
  );
};
