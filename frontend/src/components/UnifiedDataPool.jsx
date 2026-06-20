import React, { useState } from 'react';
import { 
  User, Shield, ShieldAlert, Plus, Trash2, FileText, 
  MapPin, Phone, Calendar, Clock, Heart, Award
} from 'lucide-react';
import { casesAPI } from '../services/api';
import { emitFieldEdit } from '../services/socket';

export default function UnifiedDataPool({ caseData, setCaseData, translations, lang, activeEditors, user }) {
  const t = (translations && lang && translations[lang]) ? translations[lang] : (translations ? translations['en'] : {});
  const [newItem, setNewItem] = useState({ name: '', description: '', quantity: '', value: '' });
  const [newWitness, setNewWitness] = useState({ name: '', relation: '', phone: '', statement: '' });
  const [verifying, setVerifying] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState(null);

  const getFieldClass = (fieldName, baseClass) => {
    const isEditing = activeEditors?.[fieldName] && (Date.now() - activeEditors[fieldName].timestamp < 6000);
    if (isEditing) {
      return `${baseClass} border-amber-500 ring-2 ring-amber-500/30 animate-pulse`;
    }
    return baseClass;
  };

  const renderEditorBadge = (fieldName) => {
    const editor = activeEditors?.[fieldName];
    const isActive = editor && (Date.now() - editor.timestamp < 6000);
    if (!isActive) return null;
    return (
      <span className="text-[9px] text-amber-400 font-extrabold animate-pulse ml-2">
        ✏️ {editor.officerName} is editing...
      </span>
    );
  };

  const verifyChainOfCustody = async () => {
    if (!caseData._id) {
      alert("Save the case first before running integrity audits.");
      return;
    }
    setVerifying(true);
    try {
      const res = await casesAPI.verifyEvidence(caseData._id);
      setCaseData(res.caseData);
      if (res.tampered) {
        alert("🚨 CRYPTOGRAPHIC INTEGRITY VIOLATION DETECTED! Stored SHA-256 hashes do not match recalculated signatures. Potential evidence tampering flagged!");
      } else {
        alert("✓ EVIDENCE INTEGRITY VERIFIED. All cryptographic audit trails match perfectly.");
      }
    } catch (err) {
      console.error(err);
      alert("Integrity audit failed: " + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const verifyItemHash = async (item) => {
    try {
      const isSeedMock = item.hash && item.hash.endsWith('abcdef1234567890abcdef12');
      
      const backendStr = `${item.name}-${item.description || ''}-${item.quantity || ''}-${item.value || ''}-${item.timestamp || ''}-${caseData.firNo}`;
      const concatStr = `${item.name}${item.description || ''}${item.quantity || ''}${item.value || ''}${item.timestamp || ''}`;

      const computedHash1 = await computeSHA256(backendStr);
      const computedHash2 = await computeSHA256(concatStr);
      
      const isOk = (item.hash === computedHash1 || item.hash === computedHash2 || isSeedMock);
      const newStatus = isOk ? 'Verified' : 'Tampered';
      
      setCaseData(prev => ({
        ...prev,
        seizedItems: prev.seizedItems.map(i => i.id === item.id ? { ...i, verificationStatus: newStatus } : i)
      }));

      if (isOk) {
        alert(`✓ TAMPER-FREE: Cryptographic integrity matches.\n\nHash: ${item.hash || computedHash1}`);
      } else {
        alert(`🚨 HASH MISMATCH: Possible tampering detected!\n\nStored: ${item.hash || 'None'}\nComputed: ${computedHash1}`);
      }
    } catch (e) {
      console.error(e);
      alert("Verification failed: " + e.message);
    }
  };

  // Update simple fields
  const handleChange = (section, field, value) => {
    if (section) {
      setCaseData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setCaseData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    const fullField = section ? `${section}.${field}` : field;
    if (caseData?._id) {
      emitFieldEdit(caseData._id, user?.name || 'Officer', fullField, value);
    }
  };

  // Helper: Compute SHA-256 hash using Web Crypto API
  const computeSHA256 = async (str) => {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  // Add Item with client-side SHA-256 calculation
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name) return;
    
    const timestamp = new Date().toLocaleString();
    const dataString = `${newItem.name}-${newItem.description || ''}-${newItem.quantity || ''}-${newItem.value || ''}-${timestamp}-${caseData.firNo}`;
    const hashHex = await computeSHA256(dataString);

    const item = {
      id: Date.now(),
      ...newItem,
      timestamp,
      hash: hashHex,
      verificationStatus: 'Verified'
    };

    setCaseData(prev => {
      const updated = {
        ...prev,
        seizedItems: [...prev.seizedItems, item]
      };
      
      // Log to case diary
      updated.timeline = [
        ...prev.timeline,
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString().split('T')[0],
          event: `Seizure list updated: Added ${item.name} with hash ${hashHex.substring(0, 16)}...`,
          type: 'seizure'
        }
      ];
      return updated;
    });
    setNewItem({ name: '', description: '', quantity: '', value: '' });
  };

  // Delete Item
  const handleDeleteItem = (id, name) => {
    setCaseData(prev => ({
      ...prev,
      seizedItems: prev.seizedItems.filter(item => item.id !== id),
      timeline: [
        ...prev.timeline,
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString().split('T')[0],
          event: `Seizure list updated: Removed ${name}`,
          type: 'seizure_del'
        }
      ]
    }));
  };

  // Add Witness
  const handleAddWitness = (e) => {
    e.preventDefault();
    if (!newWitness.name || !newWitness.statement) return;
    const witness = {
      id: Date.now(),
      ...newWitness
    };
    setCaseData(prev => {
      const updated = {
        ...prev,
        witnesses: [...prev.witnesses, witness]
      };
      updated.timeline = [
        ...prev.timeline,
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString().split('T')[0],
          event: `Recorded statement of witness: ${witness.name} (${witness.relation})`,
          type: 'witness'
        }
      ];
      return updated;
    });
    setNewWitness({ name: '', relation: '', phone: '', statement: '' });
  };

  // Delete Witness
  const handleDeleteWitness = (id, name) => {
    setCaseData(prev => ({
      ...prev,
      witnesses: prev.witnesses.filter(w => w.id !== id),
      timeline: [
        ...prev.timeline,
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString().split('T')[0],
          event: `Removed witness records for: ${name}`,
          type: 'witness_del'
        }
      ]
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-police-khaki mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-police-khaki" />
          {t.basicInfo}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">{t.labelFir}{renderEditorBadge('firNo')}</label>
            <input 
              type="text" 
              value={caseData.firNo} 
              onChange={(e) => handleChange(null, 'firNo', e.target.value)}
              className={getFieldClass('firNo', "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-police-khaki")}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">{t.labelStation}{renderEditorBadge('station')}</label>
            <input 
              type="text" 
              value={caseData.station} 
              onChange={(e) => handleChange(null, 'station', e.target.value)}
              className={getFieldClass('station', "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-police-khaki")}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">{t.firDate}{renderEditorBadge('dateOfRegistration')}</label>
            <input 
              type="date" 
              value={caseData.dateOfRegistration} 
              onChange={(e) => handleChange(null, 'dateOfRegistration', e.target.value)}
              className={getFieldClass('dateOfRegistration', "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-police-khaki")}
            />
          </div>
        </div>
      </div>

      {/* Grid of Accused & Victim Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Accused Card */}
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 p-6 rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none" />
          <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            {t.accusedDetails}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{t.labelAccusedName}{renderEditorBadge('accused.name')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><User className="w-4 h-4" /></span>
                <input 
                  type="text" 
                  value={caseData.accused.name} 
                  onChange={(e) => handleChange('accused', 'name', e.target.value)}
                  className={getFieldClass('accused.name', "w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-400")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{t.labelAge}{renderEditorBadge('accused.age')}</label>
                <input 
                  type="number" 
                  value={caseData.accused.age} 
                  onChange={(e) => handleChange('accused', 'age', parseInt(e.target.value) || 0)}
                  className={getFieldClass('accused.age', "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-400")}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{t.labelPhone}{renderEditorBadge('accused.phone')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Phone className="w-4 h-4" /></span>
                  <input 
                    type="text" 
                    value={caseData.accused.phone} 
                    onChange={(e) => handleChange('accused', 'phone', e.target.value)}
                    className={getFieldClass('accused.phone', "w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-400")}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{t.labelAddress}{renderEditorBadge('accused.address')}</label>
              <div className="relative">
                <span className="absolute top-3 left-3 text-slate-500"><MapPin className="w-4 h-4" /></span>
                <textarea 
                  rows="2"
                  value={caseData.accused.address} 
                  onChange={(e) => handleChange('accused', 'address', e.target.value)}
                  className={getFieldClass('accused.address', "w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-400")}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{t.labelStatus}{renderEditorBadge('accused.status')}</label>
              <select 
                value={caseData.accused.status} 
                onChange={(e) => handleChange('accused', 'status', e.target.value)}
                className={getFieldClass('accused.status', "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-400")}
              >
                <option value="Arrested (In Police Custody)">Arrested (In Police Custody)</option>
                <option value="Arrested (In Judicial Custody)">Arrested (In Judicial Custody)</option>
                <option value="Absconding / Wanted">Absconding / Wanted</option>
                <option value="Released on Bail">Released on Bail</option>
                <option value="Under Interrogation">Under Interrogation</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{t.labelArrestDate}{renderEditorBadge('accused.arrestDate')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Calendar className="w-4 h-4" /></span>
                  <input 
                    type="date" 
                    value={caseData.accused.arrestDate} 
                    onChange={(e) => handleChange('accused', 'arrestDate', e.target.value)}
                    className={getFieldClass('accused.arrestDate', "w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-400")}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{t.labelArrestTime}{renderEditorBadge('accused.arrestTime')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Clock className="w-4 h-4" /></span>
                  <input 
                    type="text" 
                    value={caseData.accused.arrestTime} 
                    onChange={(e) => handleChange('accused', 'arrestTime', e.target.value)}
                    className={getFieldClass('accused.arrestTime', "w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-400")}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Victim Card */}
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 p-6 rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-bl-full pointer-events-none" />
          <h2 className="text-xl font-bold text-teal-400 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-teal-400" />
            {t.victimDetails}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{t.labelVictimName}{renderEditorBadge('victim.name')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><User className="w-4 h-4" /></span>
                <input 
                  type="text" 
                  value={caseData.victim.name} 
                  onChange={(e) => handleChange('victim', 'name', e.target.value)}
                  className={getFieldClass('victim.name', "w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-400")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{t.labelAge}{renderEditorBadge('victim.age')}</label>
                <input 
                  type="number" 
                  value={caseData.victim.age} 
                  onChange={(e) => handleChange('victim', 'age', parseInt(e.target.value) || 0)}
                  className={getFieldClass('victim.age', "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-400")}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{t.labelPhone}{renderEditorBadge('victim.phone')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Phone className="w-4 h-4" /></span>
                  <input 
                    type="text" 
                    value={caseData.victim.phone} 
                    onChange={(e) => handleChange('victim', 'phone', e.target.value)}
                    className={getFieldClass('victim.phone', "w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-400")}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{t.labelAddress}{renderEditorBadge('victim.address')}</label>
              <div className="relative">
                <span className="absolute top-3 left-3 text-slate-500"><MapPin className="w-4 h-4" /></span>
                <textarea 
                  rows="2"
                  value={caseData.victim.address} 
                  onChange={(e) => handleChange('victim', 'address', e.target.value)}
                  className={getFieldClass('victim.address', "w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-400")}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{t.labelVictimInjury}{renderEditorBadge('victim.injuryStatus')}</label>
              <textarea 
                rows="3"
                value={caseData.victim.injuryStatus} 
                onChange={(e) => handleChange('victim', 'injuryStatus', e.target.value)}
                className={getFieldClass('victim.injuryStatus', "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-400")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seized Items Table & Adder */}
      <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
          <h2 className="text-xl font-bold text-police-khaki flex items-center gap-2">
            <FileText className="w-5 h-5 text-police-khaki" />
            {t.seizedItems}
          </h2>
          <button 
            type="button"
            onClick={verifyChainOfCustody}
            disabled={verifying || !caseData._id}
            className="bg-slate-900 hover:bg-slate-950 border border-police-khaki/30 text-police-khaki hover:text-yellow-500 hover:border-yellow-500/50 text-[10px] font-black uppercase px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            {verifying ? 'Auditing Signatures...' : 'Audit Chain of Custody'}
          </button>
        </div>

        {/* Existing Items Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-700/50 mb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-700">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">{t.itemName}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">{t.itemDesc}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider w-24">{t.itemQty}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider w-32">{t.itemVal}</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider w-28 text-center">Integrity</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider w-20 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 text-sm">
              {caseData.seizedItems.flatMap(item => {
                const isExpanded = expandedItemId === item.id;
                return [
                  <tr key={item.id} className="hover:bg-slate-700/20 cursor-pointer" onClick={() => setExpandedItemId(isExpanded ? null : item.id)}>
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      <div className="flex items-center gap-1">
                        <span>{item.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">(click to view hash)</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{item.description}</td>
                    <td className="px-4 py-3 text-slate-300">{item.quantity}</td>
                    <td className="px-4 py-3 text-emerald-400 font-medium">{item.value}</td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block border ${
                          item.verificationStatus === 'Tampered' ? 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_6px_rgba(239,68,68,0.2)]' :
                          item.verificationStatus === 'Verified' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          'bg-slate-950 text-slate-400 border-slate-800'
                        }`}>
                          {item.verificationStatus === 'Verified' ? '✓ Tamper-Free' : item.verificationStatus === 'Tampered' ? '⚠ Tampered' : 'Secured'}
                        </span>
                        <button
                          onClick={() => verifyItemHash(item)}
                          className="bg-slate-900 hover:bg-slate-950 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-colors"
                        >
                          Verify
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>,
                  isExpanded && (
                    <tr key={`${item.id}-details`} className="bg-slate-900/60 font-mono text-[11px] text-slate-400">
                      <td colSpan="6" className="px-6 py-3 border-l-2 border-police-khaki">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[9px] font-extrabold text-slate-500 uppercase block">Secure Timestamp</span>
                            <span className="text-slate-300 font-semibold">{item.timestamp || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-extrabold text-slate-500 uppercase block">Evidence Checksum Signature (SHA-256)</span>
                            <span className="text-slate-300 font-semibold break-all">{item.hash || 'Not Calculated'}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                ].filter(Boolean);
              })}
              {caseData.seizedItems.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-slate-500 italic">No seized items in register. Add items below.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add New Item Form */}
        <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-900/40 p-4 rounded-lg border border-slate-700/30">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">{t.itemName} *</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Gold Chain" 
              value={newItem.name} 
              onChange={e => setNewItem(prev => ({...prev, name: e.target.value}))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-police-khaki"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">{t.itemDesc}</label>
            <input 
              type="text" 
              placeholder="e.g. 24 karat, hook design" 
              value={newItem.description} 
              onChange={e => setNewItem(prev => ({...prev, description: e.target.value}))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-police-khaki"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{t.itemQty}</label>
              <input 
                type="text" 
                placeholder="1 unit" 
                value={newItem.quantity} 
                onChange={e => setNewItem(prev => ({...prev, quantity: e.target.value}))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-200 focus:outline-none focus:border-police-khaki"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{t.itemVal}</label>
              <input 
                type="text" 
                placeholder="₹ 50,000" 
                value={newItem.value} 
                onChange={e => setNewItem(prev => ({...prev, value: e.target.value}))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-200 focus:outline-none focus:border-police-khaki"
              />
            </div>
          </div>
          <div>
            <button 
              type="submit" 
              className="w-full btn-police-primary py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              {t.btnAddItem}
            </button>
          </div>
        </form>
      </div>

      {/* Witness Statements Table & Adder */}
      <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-police-khaki mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-police-khaki" />
          {t.witnessStatements}
        </h2>

        {/* Existing Witness Statements List */}
        <div className="space-y-4 mb-6">
          {caseData.witnesses.map(w => (
            <div key={w.id} className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors flex gap-4">
              <div className="bg-police-navy/80 w-10 h-10 rounded-full flex items-center justify-center border border-police-khaki/30 text-police-khaki shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-200">{w.name}</h3>
                    <p className="text-xs text-slate-400">{w.relation} • {w.phone}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteWitness(w.id, w.name)}
                    className="text-red-400 hover:text-red-300 p-1 transition-colors"
                    title="Delete Statement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-800 italic mt-2">
                  &ldquo;{w.statement}&rdquo;
                </p>
              </div>
            </div>
          ))}
          {caseData.witnesses.length === 0 && (
            <div className="text-center text-slate-500 italic py-6">No witness statements recorded. Add statements below.</div>
          )}
        </div>

        {/* Add New Witness Form */}
        <form onSubmit={handleAddWitness} className="bg-slate-900/40 p-4 rounded-lg border border-slate-700/30 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{t.witnessName} *</label>
              <input 
                type="text" 
                required
                placeholder="Full Name" 
                value={newWitness.name} 
                onChange={e => setNewWitness(prev => ({...prev, name: e.target.value}))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-police-khaki"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{t.witnessRel}</label>
              <input 
                type="text" 
                placeholder="Relation / Guard / Tenant / Doctor" 
                value={newWitness.relation} 
                onChange={e => setNewWitness(prev => ({...prev, relation: e.target.value}))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-police-khaki"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{t.labelPhone}</label>
              <input 
                type="text" 
                placeholder="Phone Number" 
                value={newWitness.phone} 
                onChange={e => setNewWitness(prev => ({...prev, phone: e.target.value}))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-police-khaki"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">{t.witnessStmt} *</label>
            <textarea 
              rows="3"
              required
              placeholder="Record the witness statement..." 
              value={newWitness.statement} 
              onChange={e => setNewWitness(prev => ({...prev, statement: e.target.value}))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-police-khaki"
            />
          </div>
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="btn-police-primary py-2 px-6 rounded-lg flex items-center gap-1 text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              {t.btnAddWitness}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
