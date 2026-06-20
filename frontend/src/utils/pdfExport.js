import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Draw a vector emblem logo placeholder (Gujarat Police Shield)
const drawPoliceLogo = (doc, x, y) => {
  doc.setDrawColor(12, 34, 79); // Police Navy
  doc.setFillColor(200, 159, 83); // Khaki Gold
  
  // Draw shield polygon
  doc.polygon([
    [x + 10, y], 
    [x + 20, y + 4], 
    [x + 20, y + 16], 
    [x + 10, y + 24], 
    [x, y + 16], 
    [x, y + 4]
  ], 'FD');
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(12, 34, 79);
  doc.text("GUJARAT", x + 5, y + 8);
  doc.text("POLICE", x + 6, y + 14);
};

// Add standard headers, page numbers, and rotated watermark
const addWatermarkAndDecorations = (doc, caseNo, typeLabel) => {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Faint Confidentially Watermark
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(46);
    doc.setTextColor(242, 242, 242);
    doc.text("CONFIDENTIAL", 45, 175, { angle: 45 });
    doc.text(caseNo, 65, 115, { angle: 45 });
    
    // Header Line and Text
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text("GUJARAT POLICE DEPARTMENT • LEGAL DOCUMENT GENERATOR", 14, 10);
    doc.text(`${typeLabel} | CASE ID: ${caseNo}`, 14, 14);
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, 16, 196, 16);
    
    // Footer Line and Text
    doc.line(14, 282, 196, 282);
    doc.text("CRIMEGPT SECURITY DIRECTIVE • HIGH PRIVACY POLICE RECORD", 14, 287);
    doc.text(`Page ${i} of ${pageCount}`, 178, 287);
  }
};

// 1. Export FIR PDF
export const exportFIR = (caseData) => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  
  // Title
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(12, 34, 79);
  doc.text("FIRST INFORMATION REPORT (FIR)", 45, 30);
  doc.setFontSize(10);
  doc.text("(Registered under Section 173 of Bharatiya Nagarik Suraksha Sanhita, 2023)", 45, 35);
  
  drawPoliceLogo(doc, 14, 22);

  // Block 1: FIR Metadata Table
  doc.autoTable({
    startY: 45,
    head: [['FIR Fields', 'Details / Registrations']],
    body: [
      ['FIR Number', caseData.firNo || 'N/A'],
      ['Police Station', caseData.station || 'N/A'],
      ['District / State', `${caseData.district || 'Ahmedabad City'} / ${caseData.state || 'Gujarat'}`],
      ['Date & Time of Occurrence', `${caseData.dateOfIncident || '2026-06-05'} / 02:30 AM`],
      ['Date of Registration', caseData.dateOfRegistration || 'N/A'],
      ['Investigating Officer (IO)', `${caseData.ioName} (${caseData.ioBadge})`],
      ['Station House Officer (SHO)', caseData.shoName || 'N/A'],
      ['Statutes Invoked', caseData.flaggedSections || 'N/A']
    ],
    theme: 'grid',
    headStyles: { fillColor: [12, 34, 79], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold', fillColor: [248, 245, 237] } },
    styles: { fontSize: 9 }
  });

  // Block 2: Accused & Victim Details
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Accused Profile', 'Victim Profile']],
    body: [
      [
        `Name: ${caseData.accused?.name || 'Absconding'}\nAge: ${caseData.accused?.age || 'N/A'}\nPhone: ${caseData.accused?.phone || 'N/A'}\nAddress: ${caseData.accused?.address || 'N/A'}\nStatus: ${caseData.accused?.status || 'N/A'}`,
        `Name: ${caseData.victim?.name || 'N/A'}\nAge: ${caseData.victim?.age || 'N/A'}\nPhone: ${caseData.victim?.phone || 'N/A'}\nAddress: ${caseData.victim?.address || 'N/A'}\nInjuries: ${caseData.victim?.injuryStatus || 'N/A'}`
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [200, 159, 83], textColor: [12, 34, 79], fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 3 }
  });

  // Block 3: Seized items table
  const seizedRows = caseData.seizedItems.map(item => [
    item.name, 
    item.description, 
    item.quantity, 
    item.value, 
    item.timestamp, 
    item.verificationStatus || 'Secured'
  ]);
  
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Seized Article', 'Description', 'Quantity', 'Est. Value', 'Time Seized', 'Integrity']],
    body: seizedRows.length > 0 ? seizedRows : [['-', 'No items registered in case database', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [12, 34, 79], textColor: [255, 255, 255] },
    styles: { fontSize: 8 }
  });

  // Block 4: Narrative
  const nextY = doc.lastAutoTable.finalY + 8;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(12, 34, 79);
  doc.text("Incident Narrative / Statement of Complainant:", 14, nextY);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  
  const narrativeLines = doc.splitTextToSize(caseData.narrative, 182);
  doc.text(narrativeLines, 14, nextY + 5);

  // Block 5: Signature Blocks
  const sigY = nextY + 5 + (narrativeLines.length * 4.5) + 20;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  
  // IO Signature line
  doc.line(14, sigY, 74, sigY);
  doc.text("Signature / Thumb impression", 14, sigY + 4);
  doc.text("of the Complainant / Informant", 14, sigY + 8);
  
  // SHO Signature line
  doc.line(130, sigY, 190, sigY);
  doc.text("Signature of Officer-in-Charge (SHO)", 130, sigY + 4);
  doc.text(`Name: ${caseData.shoName || 'Jadeja M. K.'}`, 130, sigY + 8);

  addWatermarkAndDecorations(doc, caseData.firNo, "FIR REPORT");
  
  doc.save(`CrimeGPT_FIR_${caseData.firNo.replace('/', '_')}.pdf`);
};

// 2. Export Chargesheet PDF
export const exportChargesheet = (caseData) => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(12, 34, 79);
  doc.text("FINAL POLICE CHARGESHEET REPORT", 45, 30);
  doc.setFontSize(10);
  doc.text("(Filed under Section 193 of Bharatiya Nagarik Suraksha Sanhita, 2023)", 45, 35);
  
  drawPoliceLogo(doc, 14, 22);

  // Chargesheet details
  doc.autoTable({
    startY: 45,
    head: [['Chargesheet Details', 'Case Information Summary']],
    body: [
      ['State/District', `${caseData.state || 'Gujarat'} / ${caseData.district || 'Ahmedabad City'}`],
      ['Police Station', caseData.station || 'N/A'],
      ['FIR Number & Date', `${caseData.firNo} / ${caseData.dateOfRegistration}`],
      ['Investigating Officer', `${caseData.ioName} (Badge ID: ${caseData.ioBadge})`],
      ['Accused Facing Trial', caseData.accused?.name || 'Absconding'],
      ['Custody/Bail Status', caseData.accused?.status || 'N/A'],
      ['Statutes Invoked (BNS)', caseData.flaggedSections || 'N/A'],
      ['Compliance Check', caseData.compliance?.status === 'PASS' ? 'Audit Passed (BNS/BNSS Compliant)' : 'Compliance Review Flagged']
    ],
    theme: 'grid',
    headStyles: { fillColor: [12, 34, 79] },
    columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold', fillColor: [248, 245, 237] } },
    styles: { fontSize: 8.5 }
  });

  // Brief evidence overview
  const evidenceRows = caseData.seizedItems.map(item => [
    item.name, 
    item.description, 
    item.quantity, 
    item.verificationStatus || 'Secured',
    item.hash.substring(0, 18) + '...'
  ]);

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Exhibits/Evidence', 'Specification', 'Quantity', 'Hash Integrity', 'SHA-256 Checksum Signature']],
    body: evidenceRows.length > 0 ? evidenceRows : [['-', 'No physical evidence listed', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [200, 159, 83], textColor: [12, 34, 79] },
    styles: { fontSize: 8 }
  });

  // Witness Schedule List
  const witnessRows = caseData.witnesses.map((w, idx) => [
    `Witness #${idx+1}: ${w.name}`,
    w.relation || 'Independent Witness',
    w.phone || 'N/A',
    w.statement.substring(0, 80) + '...'
  ]);

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Witness Details', 'Relation', 'Phone', 'Statement Summary']],
    body: witnessRows.length > 0 ? witnessRows : [['-', 'No witness statements registered', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [12, 34, 79] },
    styles: { fontSize: 8 }
  });

  // Summary of Investigation
  const nextY = doc.lastAutoTable.finalY + 8;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Statutory Investigation & Evidence Conclusion:", 14, nextY);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  
  const conclusionText = `Based on statements recorded under Section 180 BNSS and material evidence seized via Zabti Patrak under Section 105 BNSS, a prima facie case under BNS sections has been established against accused ${caseData.accused?.name || 'Vikram Solanki'}. The accused remains in ${caseData.accused?.status || ' custody'} pending judicial trial. It is prayed that cognizance of the offenses be taken for prosecution.`;
  const conclusionLines = doc.splitTextToSize(conclusionText, 182);
  doc.text(conclusionLines, 14, nextY + 5);

  // Triple signoff signatures
  const sigY = nextY + 5 + (conclusionLines.length * 4.5) + 22;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(12, 34, 79);
  
  // IO
  doc.line(14, sigY, 64, sigY);
  doc.text("Investigating Officer (IO)", 14, sigY + 4);
  doc.text(`${caseData.ioName}`, 14, sigY + 8);
  
  // SHO
  doc.line(76, sigY, 126, sigY);
  doc.text("Approve Authority (SHO)", 76, sigY + 4);
  doc.text(`${caseData.shoName}`, 76, sigY + 8);

  // Legal Advisor
  doc.line(138, sigY, 188, sigY);
  doc.text("Legal Advisor / Prosecutor", 138, sigY + 4);
  doc.text(`${caseData.legalAdvisorName}`, 138, sigY + 8);

  addWatermarkAndDecorations(doc, caseData.firNo, "CHARGESHEET");
  
  doc.save(`CrimeGPT_Chargesheet_${caseData.firNo.replace('/', '_')}.pdf`);
};

// 3. Export Panchanama PDF
export const exportPanchanama = (caseData) => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(12, 34, 79);
  doc.text("SCENE EXAMINATIONS REPORT (PANCHANAMA)", 45, 30);
  doc.setFontSize(10);
  doc.text("(Prepared under Section 105 of Bharatiya Nagarik Suraksha Sanhita, 2023)", 45, 35);
  
  drawPoliceLogo(doc, 14, 22);

  // Basic Details
  doc.autoTable({
    startY: 45,
    head: [['Panchanama Particulars', 'Case Records']],
    body: [
      ['FIR Reference', caseData.firNo],
      ['Location of Scene', caseData.station.split(',')[0]],
      ['District City', caseData.district],
      ['Panch Witnesses Present', caseData.witnesses.map(w => w.name).slice(0, 2).join(', ') || 'N/A'],
      ['Date of Examination', caseData.dateOfIncident || '2026-06-05'],
      ['Responsible Officer', `${caseData.ioName} (${caseData.ioBadge})`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [12, 34, 79] },
    columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold', fillColor: [248, 245, 237] } },
    styles: { fontSize: 9 }
  });

  // Seized items list
  const itemRows = caseData.seizedItems.map(item => [
    item.name,
    item.description,
    item.quantity,
    item.value,
    item.hash.substring(0, 24) + '...'
  ]);

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Article Seized', 'Description', 'Quantity', 'Est Value', 'Cryptographic SHA-256 Hash Signature']],
    body: itemRows.length > 0 ? itemRows : [['-', 'No items seized from scene', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [200, 159, 83], textColor: [12, 34, 79] },
    styles: { fontSize: 8.5 }
  });

  // Procedural Scene Narrative
  const nextY = doc.lastAutoTable.finalY + 8;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Scene Observations & Seizure Panchanama Narrative:", 14, nextY);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  
  const sceneText = `We, the Panchas, were summoned by Investigating Officer ${caseData.ioName} to Flat 402, Shivalik Residencia, Navrangpura. On arrival, we observed the sliding balcony door broken open. Inside the master bedroom, the steel safe was found open. The IO recovered and seized a gold bangle and laptop in our presence. The seizure operations were digitally recorded on mobile videography. The articles were signed and sealed in our presence, with hashes generated securely.`;
  const sceneLines = doc.splitTextToSize(sceneText, 182);
  doc.text(sceneLines, 14, nextY + 5);

  // Signatures
  const sigY = nextY + 5 + (sceneLines.length * 4.5) + 25;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  
  // Panch 1
  doc.line(14, sigY, 64, sigY);
  doc.text("Panch Witness 1 Signature", 14, sigY + 4);
  doc.text(caseData.witnesses[0]?.name || 'Suresh R. Patel', 14, sigY + 8);
  
  // Panch 2
  doc.line(76, sigY, 126, sigY);
  doc.text("Panch Witness 2 Signature", 76, sigY + 4);
  doc.text(caseData.witnesses[1]?.name || 'Maheshbhai K. Vyas', 76, sigY + 8);

  // IO
  doc.line(138, sigY, 188, sigY);
  doc.text("Investigating Officer (IO)", 138, sigY + 4);
  doc.text(`${caseData.ioName}`, 138, sigY + 8);

  addWatermarkAndDecorations(doc, caseData.firNo, "PANCHANAMA REPORT");
  
  doc.save(`CrimeGPT_Panchanama_${caseData.firNo.replace('/', '_')}.pdf`);
};
