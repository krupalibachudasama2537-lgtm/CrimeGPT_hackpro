import React, { useState } from 'react';
import { FileText, Printer, Download, Check, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';
import { exportFIR, exportChargesheet, exportPanchanama } from '../utils/pdfExport';

export default function DocumentEngine({ caseData, setCaseData, translations, lang, activeRole }) {
  const t = (translations && lang && translations[lang]) ? translations[lang] : (translations ? translations['en'] : {});
  const [activeDocTab, setActiveDocTab] = useState('chargesheet');
  
  // Status check for role-based actions
  const [signedIO, setSignedIO] = useState(false);
  const [signedSHO, setSignedSHO] = useState(false);
  const [stampLegal, setStampLegal] = useState(false);

  // Trigger print view
  const handlePrint = () => {
    window.print();
    
    // Add to timeline
    setCaseData(prev => ({
      ...prev,
      timeline: [
        ...prev.timeline,
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString().split('T')[0],
          event: `Printed document: ${activeDocTab.toUpperCase()}`,
          type: 'document'
        }
      ]
    }));
  };

  const handleDownload = () => {
    const docName = `${activeDocTab.toUpperCase()}_${caseData.firNo.replace(/[\/ -]/g, '_')}.pdf`;
    
    if (activeDocTab === 'chargesheet') {
      exportChargesheet(caseData);
    } else if (activeDocTab === 'panchanama' || activeDocTab === 'seizure') {
      exportPanchanama(caseData);
    } else {
      exportFIR(caseData);
    }

    // Add to timeline
    setCaseData(prev => ({
      ...prev,
      timeline: [
        ...prev.timeline,
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString().split('T')[0],
          event: `Generated and downloaded PDF: ${docName}`,
          type: "document"
        }
      ]
    }));
  };

  const executeSignature = () => {
    const timestamp = new Date().toLocaleString();
    if (activeRole === 'io') {
      setSignedIO(true);
      setCaseData(prev => ({
        ...prev,
        timeline: [
          ...prev.timeline,
          {
            id: Date.now(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toISOString().split('T')[0],
            event: `Investigating Officer ${prev.ioName} signed ${activeDocTab.toUpperCase()} at ${timestamp}`,
            type: 'document'
          }
        ]
      }));
    } else if (activeRole === 'sho') {
      setSignedSHO(true);
      setCaseData(prev => ({
        ...prev,
        timeline: [
          ...prev.timeline,
          {
            id: Date.now(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toISOString().split('T')[0],
            event: `Station House Officer ${prev.shoName} approved and signed ${activeDocTab.toUpperCase()} at ${timestamp}`,
            type: 'document'
          }
        ]
      }));
    } else if (activeRole === 'legal') {
      setStampLegal(true);
      setCaseData(prev => ({
        ...prev,
        timeline: [
          ...prev.timeline,
          {
            id: Date.now(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toISOString().split('T')[0],
            event: `Legal Advisor ${prev.legalAdvisorName} checked compliance & stamped ${activeDocTab.toUpperCase()} at ${timestamp}`,
            type: 'document'
          }
        ]
      }));
    }
  };

  // Document render functions depending on language
  const renderChargesheet = () => {
    if (lang === 'hi') {
      return (
        <div className="space-y-6">
          <div className="text-center font-bold text-lg border-b-2 border-slate-900 pb-3">
            <h3>पूरक आरोप पत्र (धारा 193(8) बीएनएसएस के तहत)</h3>
            <p className="text-sm font-medium mt-1">पूर्व में धारा 173(8) सीआरपीसी के समतुल्य</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>मामला संदर्भ (FIR No):</strong> {caseData.firNo}</div>
            <div><strong>पुलिस स्टेशन:</strong> {caseData.station}</div>
            <div><strong>घटना दिनांक:</strong> {caseData.dateOfIncident}</div>
            <div><strong>जांच अधिकारी (IO):</strong> {caseData.ioName} ({caseData.ioBadge})</div>
          </div>
          
          <div className="border-t border-slate-300 pt-4 space-y-3">
            <h4 className="font-bold underline text-sm">1. आरोपी विवरण:</h4>
            <p className="text-sm">नाम: {caseData.accused.name}, आयु: {caseData.accused.age} वर्ष, पता: {caseData.accused.address}</p>
            <p className="text-sm">हिरासत की स्थिति: {caseData.accused.status} (गिरफ्तारी दिनांक: {caseData.accused.arrestDate})</p>
          </div>

          <div className="border-t border-slate-300 pt-4 space-y-3">
            <h4 className="font-bold underline text-sm">2. कानूनी प्रावधान (धाराएं):</h4>
            <p className="text-sm">लागू बीएनएस (BNS, 2023) धाराएं: <span className="font-bold text-red-700">{caseData.flaggedSections || '303, 305, 331 BNS'}</span></p>
            <p className="text-sm">पुरानी आईपीसी (IPC) धाराएं (क्रॉस-रेफरेंस): <span>379, 380, 457 IPC</span></p>
          </div>

          <div className="border-t border-slate-300 pt-4 space-y-3">
            <h4 className="font-bold underline text-sm">3. जांच एवं एकत्रित सबूत:</h4>
            <p className="text-sm">घटना का संक्षिप्त विवरण: {caseData.narrative}</p>
            <p className="text-sm font-bold mt-2">जब्त किए गए सामान का विवरण:</p>
            <ul className="list-disc pl-5 text-sm">
              {caseData.seizedItems.map(item => (
                <li key={item.id}>{item.name} - {item.description} ({item.quantity}, मूल्य: {item.value})</li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-300 pt-4 space-y-3">
            <h4 className="font-bold underline text-sm">4. गवाहों के बयान:</h4>
            {caseData.witnesses.map(w => (
              <div key={w.id} className="text-sm pl-2 border-l-2 border-slate-400">
                <strong>{w.name} ({w.relation}):</strong> &ldquo;{w.statement}&rdquo;
              </div>
            ))}
          </div>

          <div className="border-t border-slate-300 pt-8 flex justify-between text-xs font-bold">
            <div className="text-center w-1/3">
              <div className="h-10 flex items-center justify-center">
                {signedIO ? <span className="text-emerald-600 border border-emerald-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">हस्ताक्षरित (IO)</span> : <span className="text-slate-400 italic">हस्ताक्षर प्रतीक्षित</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">जांच अधिकारी (IO)</p>
            </div>
            <div className="text-center w-1/3">
              <div className="h-10 flex items-center justify-center">
                {stampLegal ? <span className="text-indigo-600 border border-indigo-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">स्वीकृत (कानूनी सलाहकार)</span> : <span className="text-slate-400 italic">सत्यापन प्रतीक्षित</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">कानूनी सलाहकार</p>
            </div>
            <div className="text-center w-1/3">
              <div className="h-10 flex items-center justify-center">
                {signedSHO ? <span className="text-emerald-600 border border-emerald-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">हस्ताक्षरित (SHO)</span> : <span className="text-slate-400 italic">हस्ताक्षर प्रतीक्षित</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">थाना प्रभारी (SHO)</p>
            </div>
          </div>
        </div>
      );
    } else if (lang === 'gu') {
      return (
        <div className="space-y-6">
          <div className="text-center font-bold text-lg border-b-2 border-slate-900 pb-3">
            <h3>પૂરક આરોપનામું (કલમ ૧૯૩(૮) બીએનએસએસ હેઠળ)</h3>
            <p className="text-sm font-medium mt-1">અગાઉ કલમ ૧૭૩(૮) સીઆરપીસી સમકક્ષ</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>ગુના ક્રમાંક (FIR No):</strong> {caseData.firNo}</div>
            <div><strong>પોલીસ સ્ટેશન:</strong> {caseData.station}</div>
            <div><strong>બનાવની તારીખ:</strong> {caseData.dateOfIncident}</div>
            <div><strong>તપાસ કરનાર અધિકારી (IO):</strong> {caseData.ioName} ({caseData.ioBadge})</div>
          </div>

          <div className="border-t border-slate-300 pt-4 space-y-3">
            <h4 className="font-bold underline text-sm">૧. આરોપી વિગત:</h4>
            <p className="text-sm">નામ: {caseData.accused.name}, ઉંમર: {caseData.accused.age} વર્ષ, સરનામું: {caseData.accused.address}</p>
            <p className="text-sm">કસ્ટડી સ્થિતિ: {caseData.accused.status} (ધરપકડ તારીખ: {caseData.accused.arrestDate})</p>
          </div>

          <div className="border-t border-slate-300 pt-4 space-y-3">
            <h4 className="font-bold underline text-sm">૨. લાગુ કલમો:</h4>
            <p className="text-sm">નવીન બીએનએસ (BNS, 2023) કલમો: <span className="font-bold text-red-700">{caseData.flaggedSections || '303, 305, 331 BNS'}</span></p>
            <p className="text-sm">જૂની આઈપીસી (IPC) કલમો (સંદર્ભ માટે): <span>379, 380, 457 IPC</span></p>
          </div>

          <div className="border-t border-slate-300 pt-4 space-y-3">
            <h4 className="font-bold underline text-sm">૩. તપાસની વિગત અને જપ્ત કરેલ સાહિત્ય:</h4>
            <p className="text-sm">ગુનાની હકીકત: {caseData.narrative}</p>
            <p className="text-sm font-bold mt-2">જપ્ત કરેલ મુદામાલની યાદી:</p>
            <ul className="list-disc pl-5 text-sm">
              {caseData.seizedItems.map(item => (
                <li key={item.id}>{item.name} - {item.description} ({item.quantity}, કિંમત: {item.value})</li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-300 pt-4 space-y-3">
            <h4 className="font-bold underline text-sm">૪. સાક્ષીઓના નિવેદનો:</h4>
            {caseData.witnesses.map(w => (
              <div key={w.id} className="text-sm pl-2 border-l-2 border-slate-400">
                <strong>{w.name} ({w.relation}):</strong> &ldquo;{w.statement}&rdquo;
              </div>
            ))}
          </div>

          <div className="border-t border-slate-300 pt-8 flex justify-between text-xs font-bold">
            <div className="text-center w-1/3">
              <div className="h-10 flex items-center justify-center">
                {signedIO ? <span className="text-emerald-600 border border-emerald-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">સહી કરેલ (IO)</span> : <span className="text-slate-400 italic">સહી બાકી</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">તપાસ કરનાર અધિકારી (IO)</p>
            </div>
            <div className="text-center w-1/3">
              <div className="h-10 flex items-center justify-center">
                {stampLegal ? <span className="text-indigo-600 border border-indigo-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">મંજૂર (લીગલ એડવાઈઝર)</span> : <span className="text-slate-400 italic">ચકાસણી બાકી</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">લીગલ એડવાઈઝર</p>
            </div>
            <div className="text-center w-1/3">
              <div className="h-10 flex items-center justify-center">
                {signedSHO ? <span className="text-emerald-600 border border-emerald-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">સહી કરેલ (SHO)</span> : <span className="text-slate-400 italic">સહી બાકી</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">પોલીસ સ્ટેશન ઇન્ચાર્જ (SHO)</p>
            </div>
          </div>
        </div>
      );
    } else {
      // English
      return (
        <div className="space-y-6">
          <div className="text-center font-bold text-lg border-b-2 border-slate-900 pb-3">
            <h3>SUPPLEMENTARY CHARGESHEET (UNDER SECTION 193(8) BNSS, 2023)</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Formerly equivalent to Section 173(8) CrPC, 1973</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>FIR / Crime No:</strong> {caseData.firNo}</div>
            <div><strong>Police Station:</strong> {caseData.station}</div>
            <div><strong>Date of Incident:</strong> {caseData.dateOfIncident}</div>
            <div><strong>Investigating Officer (IO):</strong> {caseData.ioName} ({caseData.ioBadge})</div>
          </div>
          
          <div className="border-t border-slate-300 pt-4 space-y-2">
            <h4 className="font-bold underline text-sm">1. Accused Details:</h4>
            <p className="text-sm">Name: {caseData.accused.name}, Age: {caseData.accused.age}, Residing at: {caseData.accused.address}</p>
            <p className="text-sm">Custodial Status: {caseData.accused.status} (Arrested on {caseData.accused.arrestDate} at {caseData.accused.arrestTime})</p>
          </div>

          <div className="border-t border-slate-300 pt-4 space-y-2">
            <h4 className="font-bold underline text-sm">2. Statutory Offense Sections:</h4>
            <p className="text-sm">Recommended BNS Sections: <span className="font-bold text-red-800">{caseData.flaggedSections || '303, 305, 331 BNS'}</span></p>
            <p className="text-sm text-slate-500">Corresponding Old IPC Sections: 379, 380, 457 IPC</p>
          </div>

          <div className="border-t border-slate-300 pt-4 space-y-2">
            <h4 className="font-bold underline text-sm">3. Material Recovery & Seizures:</h4>
            <p className="text-sm">Investigation Summary: {caseData.narrative}</p>
            <p className="text-sm font-bold mt-2">Recovered & Seized Articles:</p>
            <ul className="list-disc pl-5 text-sm">
              {caseData.seizedItems.map(item => (
                <li key={item.id}>{item.name} - {item.description} ({item.quantity}, Approx Value: {item.value})</li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-300 pt-4 space-y-2">
            <h4 className="font-bold underline text-sm">4. Witness Statements under Section 180 BNSS:</h4>
            {caseData.witnesses.map(w => (
              <div key={w.id} className="text-sm pl-2 border-l-2 border-slate-400">
                <strong>{w.name} ({w.relation}):</strong> &ldquo;{w.statement}&rdquo;
              </div>
            ))}
          </div>

          <div className="border-t border-slate-300 pt-8 flex justify-between text-xs font-bold">
            <div className="text-center w-1/3">
              <div className="h-10 flex items-center justify-center">
                {signedIO ? <span className="text-emerald-600 border border-emerald-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">Signed (IO)</span> : <span className="text-slate-400 italic">Signature Pending</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">Investigating Officer (IO)</p>
            </div>
            <div className="text-center w-1/3">
              <div className="h-10 flex items-center justify-center">
                {stampLegal ? <span className="text-indigo-600 border border-indigo-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">Stamped (Legal Advisor)</span> : <span className="text-slate-400 italic">Compliance Verification Pending</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">Legal Advisor</p>
            </div>
            <div className="text-center w-1/3">
              <div className="h-10 flex items-center justify-center">
                {signedSHO ? <span className="text-emerald-600 border border-emerald-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">Signed (SHO)</span> : <span className="text-slate-400 italic">Countersign Pending</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">Station House Officer (SHO)</p>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderSeizure = () => {
    if (lang === 'hi') {
      return (
        <div className="space-y-6">
          <div className="text-center font-bold text-lg border-b-2 border-slate-900 pb-3">
            <h3>जब्ती रसीद / जब्ती पत्रक (धारा 105 बीएनएसएस के तहत)</h3>
            <p className="text-sm font-medium mt-1">अनिवार्य दृश्य/वीडियोग्राफी अभिलेख के साथ</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>एफआईआर नंबर (FIR):</strong> {caseData.firNo}</div>
            <div><strong>पुलिस स्टेशन:</strong> {caseData.station}</div>
            <div><strong>जब्ती स्थान:</strong> {caseData.accused.address}</div>
            <div><strong>जब्ती की तिथि:</strong> {caseData.accused.arrestDate}</div>
          </div>

          <div className="border-t border-slate-300 pt-4">
            <h4 className="font-bold underline text-sm mb-2">जब्त की गई संपत्तियों की सूची:</h4>
            <table className="w-full border border-slate-400 border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400">
                  <th className="border border-slate-400 px-2 py-1 text-left">क्र.सं.</th>
                  <th className="border border-slate-400 px-2 py-1 text-left">वस्तु का नाम</th>
                  <th className="border border-slate-400 px-2 py-1 text-left">विशेष विवरण</th>
                  <th className="border border-slate-400 px-2 py-1 w-20">मात्रा</th>
                  <th className="border border-slate-400 px-2 py-1 w-32">मूल्य (अनुमानित)</th>
                </tr>
              </thead>
              <tbody>
                {caseData.seizedItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="border border-slate-400 px-2 py-1">{idx+1}</td>
                    <td className="border border-slate-400 px-2 py-1 font-semibold">{item.name}</td>
                    <td className="border border-slate-400 px-2 py-1">{item.description}</td>
                    <td className="border border-slate-400 px-2 py-1 text-center">{item.quantity}</td>
                    <td className="border border-slate-400 px-2 py-1 text-right font-mono">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-300 pt-4 space-y-2 text-xs text-slate-600">
            <p><strong>घोषणा:</strong> ऊपर सूचीबद्ध संपत्तियों को गवाहों की उपस्थिति में जब्त किया गया है। धारा 105 बीएनएसएस के अनुसार दृश्य प्रमाण दर्ज कर लिया गया है।</p>
          </div>

          <div className="border-t border-slate-300 pt-8 flex justify-between text-xs font-bold">
            <div className="text-center w-1/2">
              <p className="border-t border-slate-400 pt-1 mt-10">गवाह 1 (साक्षी) हस्ताक्षर</p>
            </div>
            <div className="text-center w-1/2">
              <div className="h-10 flex items-center justify-center">
                {signedIO ? <span className="text-emerald-600 border border-emerald-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">हस्ताक्षरित (IO)</span> : <span className="text-slate-400 italic">हस्ताक्षर प्रतीक्षित</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">जांच अधिकारी (IO) हस्ताक्षर</p>
            </div>
          </div>
        </div>
      );
    } else if (lang === 'gu') {
      return (
        <div className="space-y-6">
          <div className="text-center font-bold text-lg border-b-2 border-slate-900 pb-3">
            <h3>જપ્તી પાવતી / જપ્તી પત્રક (કલમ ૧૦૫ બીએનએસએસ હેઠળ)</h3>
            <p className="text-sm font-medium mt-1">ફરજિયાત વિડીયોગ્રાફી રેકોર્ડિંગ સાથે સંકલિત</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>એફઆઈઆર નંબર (FIR):</strong> {caseData.firNo}</div>
            <div><strong>પોલીસ સ્ટેશન:</strong> {caseData.station}</div>
            <div><strong>જપ્તી સ્થળ:</strong> {caseData.accused.address}</div>
            <div><strong>જપ્તી તારીખ:</strong> {caseData.accused.arrestDate}</div>
          </div>

          <div className="border-t border-slate-300 pt-4">
            <h4 className="font-bold underline text-sm mb-2">જપ્ત મુદામાલની વિગતવાર માહિતી:</h4>
            <table className="w-full border border-slate-400 border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400">
                  <th className="border border-slate-400 px-2 py-1 text-left">ક્રમ</th>
                  <th className="border border-slate-400 px-2 py-1 text-left">મુદામાલનું નામ</th>
                  <th className="border border-slate-400 px-2 py-1 text-left">ઓળખ ચિહ્ન અને વિગત</th>
                  <th className="border border-slate-400 px-2 py-1 w-20">જથ્થો</th>
                  <th className="border border-slate-400 px-2 py-1 w-32">અંદાજિત કિંમત</th>
                </tr>
              </thead>
              <tbody>
                {caseData.seizedItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="border border-slate-400 px-2 py-1">{idx+1}</td>
                    <td className="border border-slate-400 px-2 py-1 font-semibold">{item.name}</td>
                    <td className="border border-slate-400 px-2 py-1">{item.description}</td>
                    <td className="border border-slate-400 px-2 py-1 text-center">{item.quantity}</td>
                    <td className="border border-slate-400 px-2 py-1 text-right font-mono">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-300 pt-4 space-y-2 text-xs text-slate-600">
            <p><strong>બાંહેધરી:</strong> પંચો રૂબરૂ સદરહુ મુદામાલ શંકાસ્પદ સ્થળેથી જપ્ત કરવામાં આવેલ છે. કલમ ૧૦૫ બીએનએસએસ અન્વયે તેનું ડિજિટલ રેકોર્ડિંગ પણ કરવામાં આવેલ છે.</p>
          </div>

          <div className="border-t border-slate-300 pt-8 flex justify-between text-xs font-bold">
            <div className="text-center w-1/2">
              <p className="border-t border-slate-400 pt-1 mt-10">પંચ (સાક્ષી) ના હસ્તાક્ષર</p>
            </div>
            <div className="text-center w-1/2">
              <div className="h-10 flex items-center justify-center">
                {signedIO ? <span className="text-emerald-600 border border-emerald-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">સહી કરેલ (IO)</span> : <span className="text-slate-400 italic">સહી બાકી</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">તપાસ કરનાર અધિકારી (IO)</p>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-6">
          <div className="text-center font-bold text-lg border-b-2 border-slate-900 pb-3">
            <h3>SEIZURE MEMORANDUM / ZABTI PATRAK (UNDER SECTION 105 BNSS, 2023)</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Mandatory documentation of seizure with digital/video evidence</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>FIR Number:</strong> {caseData.firNo}</div>
            <div><strong>Police Station:</strong> {caseData.station}</div>
            <div><strong>Place of Seizure:</strong> {caseData.accused.address}</div>
            <div><strong>Date of Recovery:</strong> {caseData.accused.arrestDate}</div>
          </div>

          <div className="border-t border-slate-300 pt-4">
            <h4 className="font-bold underline text-sm mb-2">Schedule of Seized Goods:</h4>
            <table className="w-full border border-slate-400 border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400">
                  <th className="border border-slate-400 px-2 py-1.5 text-left w-12">S.No</th>
                  <th className="border border-slate-400 px-2 py-1.5 text-left">Article Name</th>
                  <th className="border border-slate-400 px-2 py-1.5 text-left">Identification Marks / Description</th>
                  <th className="border border-slate-400 px-2 py-1.5 w-20 text-center">Quantity</th>
                  <th className="border border-slate-400 px-2 py-1.5 w-32 text-right">Value (Estimated)</th>
                </tr>
              </thead>
              <tbody>
                {caseData.seizedItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="border border-slate-400 px-2 py-1.5 text-center">{idx+1}</td>
                    <td className="border border-slate-400 px-2 py-1.5 font-semibold">{item.name}</td>
                    <td className="border border-slate-400 px-2 py-1.5 text-xs">{item.description}</td>
                    <td className="border border-slate-400 px-2 py-1.5 text-center">{item.quantity}</td>
                    <td className="border border-slate-400 px-2 py-1.5 text-right font-mono text-xs">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-300 pt-4 space-y-2 text-xs text-slate-500">
            <p><strong>Note:</strong> Under Section 105 BNSS, search operations were photographed/videographed and digitized records are uploaded to police software.</p>
          </div>

          <div className="border-t border-slate-300 pt-8 flex justify-between text-xs font-bold">
            <div className="text-center w-1/2">
              <p className="border-t border-slate-400 pt-1 mt-10">Signature of Witness (Panch)</p>
            </div>
            <div className="text-center w-1/2">
              <div className="h-10 flex items-center justify-center">
                {signedIO ? <span className="text-emerald-600 border border-emerald-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">Signed (IO)</span> : <span className="text-slate-400 italic">Signature Pending</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">Signature of Investigating Officer (IO)</p>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderRemand = () => {
    if (lang === 'hi') {
      return (
        <div className="space-y-6">
          <div className="text-center font-bold text-lg border-b-2 border-slate-900 pb-3">
            <h3>पुलिस रिमांड आवेदन (धारा 187 बीएनएसएस के तहत)</h3>
            <p className="text-sm font-medium mt-1">पूर्व में धारा 167 सीआरपीसी के समतुल्य</p>
          </div>
          <div className="text-sm font-bold">
            <p>सेवा में,</p>
            <p className="pl-4">मुख्य मेट्रोपॉलिटन मजिस्ट्रेट महोदय,</p>
            <p className="pl-4">अहमदाबाद न्यायालय, गुजरात</p>
          </div>
          <div className="text-sm space-y-4">
            <p><strong>विषय:</strong> आरोपी {caseData.accused.name} को धारा 187 बीएनएसएस के तहत 14 दिनों की पुलिस हिरासत (रिमांड) में भेजने का अनुरोध।</p>
            <p><strong>महोदय,</strong></p>
            <p className="indent-8 leading-relaxed">विनम्र निवेदन है कि दिनांक {caseData.dateOfIncident} को घटित चोरी और गृह-भेदन की घटना के संबंध में मामला {caseData.firNo} पुलिस स्टेशन {caseData.station} में दर्ज किया गया है। जांच के दौरान, आरोपी {caseData.accused.name} को {caseData.accused.arrestDate} को गिरफ्तार किया गया है।</p>
            
            <p className="font-bold underline">पुलिस हिरासत के लिए मजबूत आधार:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>घटना में इस्तेमाल किए गए अन्य औजारों और चोरी की गई अन्य वस्तुओं को बरामद करना शेष है।</li>
              <li>सह-आरोपियों और अपराध में उनके सहयोगियों की पहचान और गिरफ्तारी आवश्यक है।</li>
              <li>आरोपी के पिछले आपराधिक इतिहास और उसके अंतर-राज्यीय नेटवर्क का विवरण प्राप्त करना है।</li>
            </ol>

            <p className="indent-8">अतः न्यायहित में आरोपी को 14 दिनों के लिए पुलिस रिमांड पर दिया जाना अत्यंत आवश्यक है।</p>
          </div>

          <div className="border-t border-slate-300 pt-8 flex justify-between text-xs font-bold">
            <div className="text-center w-1/2">
              <div className="h-10 flex items-center justify-center">
                {stampLegal ? <span className="text-indigo-600 border border-indigo-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">सत्यापित (कानूनी सलाहकार)</span> : <span className="text-slate-400 italic">स्वीकृति लंबित</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">प्रस्तुतकर्ता: पुलिस अभियोजक / कानूनी सलाहकार</p>
            </div>
            <div className="text-center w-1/2">
              <div className="h-10 flex items-center justify-center">
                {signedIO ? <span className="text-emerald-600 border border-emerald-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">हस्ताक्षरित (IO)</span> : <span className="text-slate-400 italic">हस्ताक्षर प्रतीक्षित</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">जांच अधिकारी (IO) हस्ताक्षर</p>
            </div>
          </div>
        </div>
      );
    } else if (lang === 'gu') {
      return (
        <div className="space-y-6">
          <div className="text-center font-bold text-lg border-b-2 border-slate-900 pb-3">
            <h3>પોલીસ રિમાન્ડ મેળવવા અંગેની અરજી (કલમ ૧૮૭ બીએનએસએસ હેઠળ)</h3>
            <p className="text-sm font-medium mt-1">અગાઉ કલમ ૧૬૭ સીઆરપીસી સમકક્ષ</p>
          </div>
          <div className="text-sm font-bold">
            <p>પ્રતિ,</p>
            <p className="pl-4">માનનીય ચીફ મેટ્રોપોલિટન મેજીસ્ટ્રેટ સાહેબ,</p>
            <p className="pl-4">અમદાવાદ કોર્ટ, ગુજરાત</p>
          </div>
          <div className="text-sm space-y-4">
            <p><strong>વિષય:</strong> આરોપી {caseData.accused.name} ને કલમ ૧૮૭ બીએનએસએસ હેઠળ ૧૪ દિવસની પોલીસ કસ્ટડી (રિમાન્ડ) મેળવવા બાબત.</p>
            <p><strong>સાહેબ સવિનય,</strong></p>
            <p className="indent-8 leading-relaxed">ઉપરોક્ત વિષય અને વિગતે જણાવવાનું કે ગુના રજીસ્ટ્રેશન નંબર {caseData.firNo} જે {caseData.station} ખાતે નોંધાયેલ છે તેની તપાસ ચાલુ છે. સદર ગુનાના આરોપી {caseData.accused.name} ની ધરપકડ તારીખ {caseData.accused.arrestDate} ના રોજ કરવામાં આવેલ છે.</p>

            <p className="font-bold underline">પોલીસ કસ્ટડી (રિમાન્ડ) મેળવવાના કારણો:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>ચોરી કરેલ અન્ય દાગીના અને વધારાના મુદ્દામાલની શોધન પ્રક્રિયા અને રીકવરી બાકી છે.</li>
              <li>ગુનામાં સંડોવાયેલા અન્ય સહ-આરોપીઓની ધરપકડ કરવા માટે આરોપીની હાજરી અનિવાર્ય છે.</li>
              <li>આરોપી કયા નેટવર્ક સાથે જોડાયેલો છે તેની ઉંડાણપૂર્વક પૂછપરછ કરવાની રહે છે.</li>
            </ol>

            <p className="indent-8">આથી નામદાર કોર્ટને નમ્ર અરજી છે કે ન્યાયના હિતમાં આરોપીને ૧૪ દિવસના પોલીસ રિમાન્ડ આપવા હુકમ કરવા વિનંતી.</p>
          </div>

          <div className="border-t border-slate-300 pt-8 flex justify-between text-xs font-bold">
            <div className="text-center w-1/2">
              <div className="h-10 flex items-center justify-center">
                {stampLegal ? <span className="text-indigo-600 border border-indigo-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">મંજૂર (લીગલ એડવાઈઝર)</span> : <span className="text-slate-400 italic">ચકાસણી બાકી</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">રજૂ કરનાર: લીગલ પ્રોસિક્યુટર</p>
            </div>
            <div className="text-center w-1/2">
              <div className="h-10 flex items-center justify-center">
                {signedIO ? <span className="text-emerald-600 border border-emerald-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">સહી કરેલ (IO)</span> : <span className="text-slate-400 italic">સહી બાકી</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">તપાસ કરનાર અધિકારી (IO)</p>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-6">
          <div className="text-center font-bold text-lg border-b-2 border-slate-900 pb-3">
            <h3>APPLICATION FOR POLICE REMAND (UNDER SECTION 187 BNSS, 2023)</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Requesting police custody extension (formerly Section 167 CrPC)</p>
          </div>
          <div className="text-sm font-bold">
            <p>To,</p>
            <p className="pl-4">The Chief Metropolitan Magistrate,</p>
            <p className="pl-4">Ahmedabad City District Court, Gujarat</p>
          </div>
          <div className="text-sm space-y-4">
            <p><strong>SUBJECT:</strong> Application for grant of Police Custody Remand of Accused <strong>{caseData.accused.name}</strong> for a period of 14 days under Sec 187 of BNSS, 2023.</p>
            <p><strong>Respected Sir / Madam,</strong></p>
            <p className="indent-8 leading-relaxed">It is submitted that the accused {caseData.accused.name} was arrested on {caseData.accused.arrestDate} at {caseData.accused.arrestTime} in connection with FIR No. {caseData.firNo} registered under BNS sections {caseData.flaggedSections || '303, 305, 331'} at {caseData.station}.</p>

            <p className="font-bold underline">Grounds for Seeking Police Custody:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>To recover the balance of the stolen property (Gold bangle and laptop details) and locate the buyer of the stolen goods.</li>
              <li>To verify the credentials of the accused and establish his connection with other interstate housebreaking networks.</li>
              <li>To perform a site reconstruction of the crime scene to verify the entry point of the break-in.</li>
            </ul>

            <p className="indent-8">Hence, it is prayed that police custody of the accused be granted for 14 days in the interest of justice.</p>
          </div>

          <div className="border-t border-slate-300 pt-8 flex justify-between text-xs font-bold">
            <div className="text-center w-1/2">
              <div className="h-10 flex items-center justify-center">
                {stampLegal ? <span className="text-indigo-600 border border-indigo-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">Verified (Legal Advisor)</span> : <span className="text-slate-400 italic">Clearance Pending</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">Presented by: Assistant Public Prosecutor</p>
            </div>
            <div className="text-center w-1/2">
              <div className="h-10 flex items-center justify-center">
                {signedIO ? <span className="text-emerald-600 border border-emerald-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">Signed (IO)</span> : <span className="text-slate-400 italic">Signature Pending</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">Signature of Investigating Officer (IO)</p>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderPanchanama = () => {
    if (lang === 'hi') {
      return (
        <div className="space-y-6">
          <div className="text-center font-bold text-lg border-b-2 border-slate-900 pb-3">
            <h3>आरोपी तलाशी पंचनामा (धारा 51 और 105 बीएनएसएस)</h3>
            <p className="text-sm font-medium mt-1">शारीरिक तलाशी और बरामदगी का पंचनामा</p>
          </div>
          <div className="text-sm space-y-4">
            <p><strong>पंचों का नाम:</strong></p>
            <ol className="list-decimal pl-5">
              <li>पंच 1: सुरेश आर. पटेल, उम्र 45 वर्ष, पेशा: सुरक्षा गार्ड, पता: अहमदाबाद।</li>
              <li>पंच 2: महेशभाई के. व्यास, उम्र 52 वर्ष, पेशा: व्यवसाय, पता: अहमदाबाद।</li>
            </ol>
            
            <p className="indent-8 leading-relaxed">आज दिनांक {caseData.accused.arrestDate} को समय {caseData.accused.arrestTime} बजे, हम पंचों को पुलिस स्टेशन {caseData.station} द्वारा बुलाया गया। हमारे समक्ष पुलिस अधिकारी ने हिरासत में लिए गए आरोपी <strong>{caseData.accused.name}</strong> की शारीरिक तलाशी ली।</p>

            <p className="font-bold underline">शारीरिक तलाशी के दौरान बरामदगी का विवरण:</p>
            <p className="leading-relaxed">आरोपी की जेबों और व्यक्तिगत बैग से निम्नलिखित वस्तुएं बरामद हुईं, जिन्हें हमारे सामने कब्जे में लिया गया है:</p>
            <ul className="list-disc pl-5">
              {caseData.seizedItems.map(item => (
                <li key={item.id} className="font-semibold">{item.name} - {item.description} ({item.quantity})</li>
              ))}
            </ul>
            <p className="indent-8 mt-2">पंचनामा हमारे कहे अनुसार लिखा गया है, और हमने इसे पढ़कर इस पर हस्ताक्षर किए हैं।</p>
          </div>

          <div className="border-t border-slate-300 pt-8 flex justify-between text-xs font-bold">
            <div className="text-center w-1/3">
              <p className="border-t border-slate-400 pt-1 mt-10">पंच 1 (हस्ताक्षर)</p>
            </div>
            <div className="text-center w-1/3">
              <p className="border-t border-slate-400 pt-1 mt-10">पंच 2 (हस्ताक्षर)</p>
            </div>
            <div className="text-center w-1/3">
              <div className="h-10 flex items-center justify-center">
                {signedIO ? <span className="text-emerald-600 border border-emerald-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">हस्ताक्षरित (IO)</span> : <span className="text-slate-400 italic">हस्ताक्षर प्रतीक्षित</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">जांच अधिकारी (IO) हस्ताक्षर</p>
            </div>
          </div>
        </div>
      );
    } else if (lang === 'gu') {
      return (
        <div className="space-y-6">
          <div className="text-center font-bold text-lg border-b-2 border-slate-900 pb-3">
            <h3>આરોપી ઝડતી પંચનામું (કલમ ૫૧ અને ૧૦૫ બીએનએસએસ)</h3>
            <p className="text-sm font-medium mt-1">આરોપીની અંગ ઝડતી અને મુદામાલ જપ્તીની કાર્યવાહી</p>
          </div>
          <div className="text-sm space-y-4">
            <p><strong>પંચોના નામ અને વિગત:</strong></p>
            <ol className="list-decimal pl-5">
              <li>પંચ ૧: સુરેશ આર. પટેલ, ઉંમર: ૪૫ વર્ષ, ધંધો: સિક્યુરિટી ગાર્ડ, રહે. અમદાવાદ.</li>
              <li>પંચ ૨: મહેશભાઈ કે. વ્યાસ, ઉંમર: ૫૨ વર્ષ, ધંધો: વેપાર, રહે. અમદાવાદ.</li>
            </ol>

            <p className="indent-8 leading-relaxed">આજ રોજ તારીખ {caseData.accused.arrestDate} ના રોજ અને સમય {caseData.accused.arrestTime} કલાકે, અમો પંચોને {caseData.station} ના પોલીસ અધિકારીએ બોલાવેલ. અમારી સમક્ષ હાજર આરોપી <strong>{caseData.accused.name}</strong> ની અંગ ઝડતી કરવામાં આવી હતી.</p>

            <p className="font-bold underline">અંગ ઝડતી અને કસ્ટડી દરમિયાન જપ્ત કરેલ સાહિત્ય:</p>
            <p className="leading-relaxed">આરોપી પાસેથી નીચે મુજબનો મુદ્દામાલ અમારી હાજરીમાં જપ્ત કરી કસ્ટડીમાં લેવામાં આવ્યો છે:</p>
            <ul className="list-disc pl-5">
              {caseData.seizedItems.map(item => (
                <li key={item.id} className="font-semibold">{item.name} - {item.description} ({item.quantity})</li>
              ))}
            </ul>
            <p className="indent-8 mt-2">આ પંચનામું અમોએ વાંચી, તેમાં જણાવેલ વિગતો સાચી હોવાની ખાતરી કરીને સહીઓ કરેલ છે.</p>
          </div>

          <div className="border-t border-slate-300 pt-8 flex justify-between text-xs font-bold">
            <div className="text-center w-1/3">
              <p className="border-t border-slate-400 pt-1 mt-10">પંચ ૧ (હસ્તાક્ષર)</p>
            </div>
            <div className="text-center w-1/3">
              <p className="border-t border-slate-400 pt-1 mt-10">પંચ ૨ (હસ્તાક્ષર)</p>
            </div>
            <div className="text-center w-1/3">
              <div className="h-10 flex items-center justify-center">
                {signedIO ? <span className="text-emerald-600 border border-emerald-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">સહી કરેલ (IO)</span> : <span className="text-slate-400 italic">સહી બાકી</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">તપાસ કરનાર અધિકારી (IO)</p>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-6">
          <div className="text-center font-bold text-lg border-b-2 border-slate-900 pb-3">
            <h3>SEARCH & ARREST PANCHANAMA (UNDER SECTION 51 & 105 BNSS, 2023)</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Formerly Section 51 & 100 of CrPC, 1973</p>
          </div>
          <div className="text-sm space-y-4">
            <p><strong>Names and Details of Panchas (Witnesses):</strong></p>
            <ol className="list-decimal pl-5">
              <li>Panch 1: Suresh R. Patel, Age: 45, Occ: Security Guard, Add: Ahmedabad, Gujarat.</li>
              <li>Panch 2: Maheshbhai K. Vyas, Age: 52, Occ: Business, Add: Ahmedabad, Gujarat.</li>
            </ol>
            
            <p className="indent-8 leading-relaxed">Today on date {caseData.accused.arrestDate} at {caseData.accused.arrestTime}, we the Panchas were summoned to {caseData.station}. In our presence, the investigating officer conducted a search of the person of accused <strong>{caseData.accused.name}</strong> who is in custody.</p>

            <p className="font-bold underline">Articles Recovered and Seized during Person Search:</p>
            <p className="leading-relaxed">The following items were found and sealed under seizure seal in our presence:</p>
            <ul className="list-disc pl-5">
              {caseData.seizedItems.map(item => (
                <li key={item.id} className="font-semibold">{item.name} - {item.description} ({item.quantity})</li>
              ))}
            </ul>
            <p className="indent-8 mt-2">This panchanama is read over to us, and we verify that the contents are correct and have signed in agreement.</p>
          </div>

          <div className="border-t border-slate-300 pt-8 flex justify-between text-xs font-bold">
            <div className="text-center w-1/3">
              <p className="border-t border-slate-400 pt-1 mt-10">Signature of Panch 1</p>
            </div>
            <div className="text-center w-1/3">
              <p className="border-t border-slate-400 pt-1 mt-10">Signature of Panch 2</p>
            </div>
            <div className="text-center w-1/3">
              <div className="h-10 flex items-center justify-center">
                {signedIO ? <span className="text-emerald-600 border border-emerald-600 px-2 py-0.5 rounded uppercase rotate-[-3deg] font-mono">Signed (IO)</span> : <span className="text-slate-400 italic">Signature Pending</span>}
              </div>
              <p className="border-t border-slate-400 pt-1">Signature of Investigating Officer (IO)</p>
            </div>
          </div>
        </div>
      );
    }
  };

  const getDocContent = () => {
    switch (activeDocTab) {
      case 'chargesheet':
        return renderChargesheet();
      case 'seizure':
        return renderSeizure();
      case 'remand':
        return renderRemand();
      case 'panchanama':
        return renderPanchanama();
      default:
        return null;
    }
  };

  // Determine current signing status based on activeRole
  const getSignatureStatusText = () => {
    if (activeRole === 'io') {
      return signedIO ? "Document signed by IO. Resign if needed." : "Sign Document as Investigating Officer (IO)";
    } else if (activeRole === 'sho') {
      return signedSHO ? "Document approved by SHO. Resign if needed." : "Countersign & Approve Document as SHO";
    } else if (activeRole === 'legal') {
      return stampLegal ? "Legal verification complete." : "Affix Legal Advisor Compliance Stamp";
    }
    return "";
  };

  const isSignedByCurrentRole = () => {
    if (activeRole === 'io') return signedIO;
    if (activeRole === 'sho') return signedSHO;
    if (activeRole === 'legal') return stampLegal;
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 p-6 rounded-xl shadow-lg">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 no-print">
          <div>
            <h2 className="text-xl font-bold text-police-khaki flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              {t.docs}
            </h2>
            <p className="text-xs text-slate-400 mt-1"> statutory legal forms synced with the Unified Pool</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <button 
              onClick={handlePrint}
              className="flex-1 lg:flex-initial bg-slate-900 border border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              {t.btnPrint}
            </button>
            <button 
              onClick={handleDownload}
              className="flex-1 lg:flex-initial bg-slate-900 border border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              {t.btnDownload}
            </button>
          </div>
        </div>

        {/* Tab buttons for 4 statutory docs */}
        <div className="flex flex-wrap gap-1 bg-slate-900 p-1.5 rounded-lg border border-slate-800/60 mb-6 no-print">
          <button 
            onClick={() => setActiveDocTab('chargesheet')}
            className={`flex-1 min-w-[150px] text-center py-2.5 rounded-md text-xs font-bold transition-all ${
              activeDocTab === 'chargesheet' ? 'bg-police-khaki text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.doc1Name.split('(')[0]}
          </button>
          <button 
            onClick={() => setActiveDocTab('seizure')}
            className={`flex-1 min-w-[150px] text-center py-2.5 rounded-md text-xs font-bold transition-all ${
              activeDocTab === 'seizure' ? 'bg-police-khaki text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.doc2Name.split('(')[0]}
          </button>
          <button 
            onClick={() => setActiveDocTab('remand')}
            className={`flex-1 min-w-[150px] text-center py-2.5 rounded-md text-xs font-bold transition-all ${
              activeDocTab === 'remand' ? 'bg-police-khaki text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.doc3Name.split('(')[0]}
          </button>
          <button 
            onClick={() => setActiveDocTab('panchanama')}
            className={`flex-1 min-w-[150px] text-center py-2.5 rounded-md text-xs font-bold transition-all ${
              activeDocTab === 'panchanama' ? 'bg-police-khaki text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.doc4Name}
          </button>
        </div>

        {/* Role-Based Document Signing Interface */}
        <div className="mb-6 p-4 rounded-xl border border-slate-700/40 bg-slate-900/40 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
          <div className="flex items-center gap-2">
            {activeRole === 'io' && <Award className="w-5 h-5 text-police-khaki" />}
            {activeRole === 'sho' && <ShieldAlert className="w-5 h-5 text-red-400" />}
            {activeRole === 'legal' && <Check className="w-5 h-5 text-indigo-400" />}
            <div>
              <div className="text-xs font-bold text-slate-400">Current Role Verification</div>
              <div className="text-sm font-extrabold text-slate-200 capitalize">
                {activeRole === 'io' && `${caseData.ioName} (Investigating Officer)`}
                {activeRole === 'sho' && `${caseData.shoName} (Station House Officer)`}
                {activeRole === 'legal' && `${caseData.legalAdvisorName} (Legal Compliance Advisor)`}
              </div>
            </div>
          </div>
          
          <button 
            onClick={executeSignature}
            className={`w-full md:w-auto text-xs px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
              isSignedByCurrentRole() 
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
                : 'bg-police-khaki text-slate-950 hover:bg-police-khaki-dark hover:text-white'
            }`}
          >
            {isSignedByCurrentRole() ? (
              <>
                <Check className="w-4 h-4" />
                <span>Verification & Signature Affixed</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>{getSignatureStatusText()}</span>
              </>
            )}
          </button>
        </div>

        {/* Document Printable Sheet */}
        <div className="bg-slate-900 border border-slate-800 p-2 md:p-6 rounded-xl">
          <div 
            id="printable-doc-content" 
            className="document-page p-6 md:p-10 text-slate-800 rounded shadow-inner max-w-3xl mx-auto overflow-y-auto leading-relaxed"
            style={{ minHeight: '650px' }}
          >
            {getDocContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
