import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, Copy, PlusCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { aiAPI } from '../services/api';

export default function OCRUploader({ caseData, onUpdateCase }) {
  const [dragActive, setDragActive] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const processFile = async (file) => {
    // Check supported types: PNG, JPG, PDF (first page as image in simple browser environment)
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert("Invalid file format. Please upload PNG, JPG, JPEG, or PDF.");
      return;
    }

    setFileName(file.name);
    setOcrLoading(true);
    setProgress(0);
    setStatusText("Initializing Tesseract OCR Engine...");
    setExtractedText("");

    try {
      // Run Tesseract.js OCR with eng + guj language packs client-side
      const result = await Tesseract.recognize(file, 'eng+guj', {
        logger: m => {
          if (m.status === 'recognizing') {
            setProgress(Math.round(m.progress * 100));
            setStatusText(`Recognizing characters (eng+guj): ${Math.round(m.progress * 100)}%`);
          } else {
            setStatusText(m.status);
          }
        }
      });

      setExtractedText(result.data.text);
      setStatusText("Text extraction completed successfully.");
    } catch (err) {
      console.error("OCR process error:", err);
      setStatusText("OCR failed: " + err.message);
      alert("OCR Text Extraction failed: " + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  const copyToNarrative = () => {
    if (!extractedText) return;
    onUpdateCase({
      ...caseData,
      narrative: extractedText
    });
    alert("Extracted text successfully copied to FIR Narrative.");
  };

  const extractSeizedItems = async () => {
    if (!extractedText) return;
    setOcrLoading(true);
    setStatusText("Parsing text structure via AI...");
    
    try {
      // Call backend API to parse OCR text into structured items
      const parsedData = await aiAPI.parseOcrText(extractedText);
      
      const newItems = [];
      const timestamp = new Date().toLocaleString();
      
      if (parsedData.seizedArticles && parsedData.seizedArticles.length > 0) {
        parsedData.seizedArticles.forEach((item, idx) => {
          newItems.push({
            id: Date.now() + idx,
            name: item.name || "Seized Article",
            description: item.description || "Parsed from scanned document",
            quantity: item.quantity || "1 unit",
            value: item.value || "₹ 0",
            timestamp,
            verificationStatus: 'Secured'
          });
        });
      } else {
        // Fallback: simple client-side line-by-line parser if AI fails to return items
        const lines = extractedText.split('\n');
        lines.forEach((line, idx) => {
          const match = line.match(/(?:gold|laptop|phone|crowbar|cash|chain|bangle|watch|weapon|pistol|vehicle|car|bike)/i);
          if (match) {
            newItems.push({
              id: Date.now() + idx,
              name: line.trim().substring(0, 30),
              description: "Extracted client-side via keyword matching",
              quantity: "1 unit",
              value: "₹ 0",
              timestamp,
              verificationStatus: 'Secured'
            });
          }
        });
      }

      if (newItems.length > 0) {
        onUpdateCase({
          ...caseData,
          seizedItems: [...caseData.seizedItems, ...newItems],
          timeline: [
            ...caseData.timeline,
            {
              id: Date.now(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              date: new Date().toISOString().split('T')[0],
              event: `Evidence list appended: Added ${newItems.length} items from scanned document ${fileName}`,
              type: 'seizure'
            }
          ]
        });
        alert(`Successfully extracted and registered ${newItems.length} seized items!`);
      } else {
        alert("Could not identify any distinct seized items in the text. Please register manually.");
      }
    } catch (err) {
      console.warn("AI OCR parsing failed, running client-side regex fallback:", err);
      // Fallback client-side parsing
      const newItems = [];
      const timestamp = new Date().toLocaleString();
      const lines = extractedText.split('\n');
      lines.forEach((line, idx) => {
        if (line.trim().length > 10 && /(?:gold|laptop|phone|crowbar|cash|chain|bangle|watch|weapon|pistol)/i.test(line)) {
          newItems.push({
            id: Date.now() + idx,
            name: line.trim().split(/[-,:]/)[0].substring(0, 25),
            description: line.trim().substring(0, 60),
            quantity: "1 unit",
            value: "₹ 0",
            timestamp,
            verificationStatus: 'Secured'
          });
        }
      });

      if (newItems.length > 0) {
        onUpdateCase({
          ...caseData,
          seizedItems: [...caseData.seizedItems, ...newItems]
        });
        alert(`Successfully extracted ${newItems.length} items (Client-side regex fallback).`);
      } else {
        alert("Failed to parse structure. Try pasting the text into narrative and running AI Analysis.");
      }
    } finally {
      setOcrLoading(false);
      setStatusText("");
    }
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 p-6 rounded-xl shadow-lg space-y-6">
      <div className="border-b border-slate-700 pb-3">
        <h3 className="text-base font-bold text-police-khaki flex items-center gap-2">
          <Upload className="w-5 h-5 text-police-khaki" />
          OCR Evidence Intake Panel
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">
          Scan incident logs, seizure memos, or witness letters (English + Gujarati) to extract case data automatically.
        </p>
      </div>

      {/* Drag & Drop Area */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
          dragActive 
            ? 'border-yellow-500 bg-yellow-500/5' 
            : 'border-slate-600 hover:border-police-khaki/50 bg-slate-900/40 hover:bg-slate-900/70'
        }`}
      >
        <input 
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleChange}
        />
        <FileText className={`w-12 h-12 mb-3 transition-colors ${dragActive ? 'text-yellow-500' : 'text-slate-500 group-hover:text-police-khaki'}`} />
        <span className="text-xs font-bold text-slate-200 text-center">
          {fileName ? `Selected: ${fileName}` : "Drag & drop scanned file here or click to browse"}
        </span>
        <span className="text-[10px] text-slate-500 mt-1 font-mono uppercase">PNG, JPG, PDF (Max 10MB) • Gujarati + English</span>
      </div>

      {/* Progress & Loading States */}
      {ocrLoading && (
        <div className="space-y-2.5 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-[10px] font-mono text-police-khaki">
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin" />
              {statusText}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-police-khaki h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Extracted Text Result */}
      {extractedText && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Extracted Document Text</span>
            <span className="text-emerald-400 text-[10px] font-black flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> READY
            </span>
          </div>

          <textarea
            rows="5"
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-police-khaki font-mono leading-relaxed"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={copyToNarrative}
              className="bg-slate-900 hover:bg-slate-950 border border-police-khaki/30 hover:border-police-khaki text-police-khaki text-xs font-black py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Copy to FIR Narrative</span>
            </button>
            <button
              type="button"
              onClick={extractSeizedItems}
              className="bg-police-khaki hover:bg-yellow-500 text-slate-950 text-xs font-black py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Extract to Seized Items</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
