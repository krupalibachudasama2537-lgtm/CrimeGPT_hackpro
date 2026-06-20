import { streamNarrativeAnalysis, auditCompliance, detectWitnessContradictions, extractOcrFields } from '../services/aiService.js';
import { retrieveContext } from '../services/ragService.js';
import Case from '../models/case.js';
import AuditLog from '../models/auditLog.js';
import mongoose from 'mongoose';
import { offlineDb } from '../services/offlineStorage.js';

export const analyzeNarrativeStream = async (req, res) => {
  const { narrative } = req.body;
  
  if (!narrative) {
    return res.status(400).json({ message: 'Narrative text is required' });
  }

  // Set headers for Server-Sent Events (SSE)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // bypass proxy buffering
  });

  try {
    // 1. Retrieve RAG context
    console.log('Retrieving RAG context for narrative...');
    const context = await retrieveContext(narrative, 4);
    
    // Send retrieved references back first so the user sees what was fetched
    res.write(`event: context\ndata: ${JSON.stringify(context)}\n\n`);

    // 2. Stream Gemini LLM generation
    console.log('Initiating streaming analysis...');
    const finalJson = await streamNarrativeAnalysis(
      narrative, 
      context, 
      (textChunk) => {
        // Stream explanation text chunks live
        res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
      }
    );

    // 3. Send final structured data and terminate stream
    res.write(`event: result\ndata: ${JSON.stringify(finalJson)}\n\n`);
    res.write('event: end\ndata: close\n\n');
    res.end();
  } catch (err) {
    console.error('Narrative analysis stream failed:', err);
    res.write(`event: error\ndata: ${JSON.stringify({ message: 'Analysis failed: ' + err.message })}\n\n`);
    res.end();
  }
};

export const auditCase = async (req, res) => {
  const caseId = req.params.id;
  
  try {
    const isOffline = mongoose.connection.readyState !== 1;
    let caseItem;

    if (!isOffline) {
      caseItem = await Case.findById(caseId);
    } else {
      caseItem = await offlineDb.cases.findById(caseId);
    }

    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }

    console.log(`Running agentic compliance auditor for case: ${caseItem.firNo}`);
    const auditResults = await auditCompliance(caseItem);
    
    // Update compliance results
    const complianceData = {
      score: auditResults.score,
      status: auditResults.status,
      missingItems: auditResults.missingItems,
      relevantSections: auditResults.relevantSections
    };

    // Add audit status to case timeline logs
    const updatedTimeline = [...caseItem.timeline, {
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      event: `Agentic Compliance Audit executed. Score: ${auditResults.score}% (${auditResults.status})`,
      type: 'ai'
    }];

    let savedCase;
    if (!isOffline) {
      savedCase = await Case.findByIdAndUpdate(caseId, {
        $set: {
          compliance: complianceData,
          timeline: updatedTimeline
        }
      }, { new: true });
    } else {
      savedCase = await offlineDb.cases.findByIdAndUpdate(caseId, {
        $set: {
          compliance: complianceData,
          timeline: updatedTimeline
        }
      });
    }
    
    // Log action to AuditLog
    const logData = {
      action: 'COMPLIANCE_AUDIT',
      caseId: savedCase._id.toString(),
      userId: req.user.id,
      username: req.user.username,
      badge: req.user.badge,
      role: req.user.role,
      details: `Compliance audit executed: Score ${auditResults.score}%, Status: ${auditResults.status}`
    };

    if (!isOffline) {
      const audit = new AuditLog(logData);
      await audit.save();
    } else {
      await offlineDb.auditLogs.create(logData);
    }

    // Broadcast live WebSocket update
    if (req.io) {
      req.io.to(caseId).emit('caseUpdated', {
        case: savedCase,
        updatedBy: 'Compliance Auditor Agent',
        details: `Compliance Audit executed. Status: ${auditResults.status}.`
      });
    }

    res.json(auditResults);
  } catch (err) {
    console.error('Case audit route failed:', err);
    res.status(500).json({ message: 'Server error during compliance audit' });
  }
};

export const checkContradictions = async (req, res) => {
  const caseId = req.params.id;

  try {
    const isOffline = mongoose.connection.readyState !== 1;
    let caseItem;

    if (!isOffline) {
      caseItem = await Case.findById(caseId);
    } else {
      caseItem = await offlineDb.cases.findById(caseId);
    }

    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (caseItem.witnesses.length === 0) {
      return res.status(400).json({ message: 'At least one witness statement is required to run contradiction checking' });
    }

    console.log(`Analyzing witness statements for case: ${caseItem.firNo}`);
    const results = await detectWitnessContradictions(caseItem.narrative, caseItem.witnesses);

    // Save contradictions
    const contradictionsData = results.contradictions.map(c => ({
      type: c.type,
      statement1: c.statement1,
      statement2: c.statement2,
      explanation: c.explanation,
      confidenceScore: Math.round(c.confidenceScore * 100)
    }));

    // Log action to timeline
    const updatedTimeline = [...caseItem.timeline, {
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      event: `Witness statements contradiction detector executed. Discrepancies found: ${results.contradictions.length}`,
      type: 'ai'
    }];

    let savedCase;
    if (!isOffline) {
      savedCase = await Case.findByIdAndUpdate(caseId, {
        $set: {
          contradictions: contradictionsData,
          timeline: updatedTimeline
        }
      }, { new: true });
    } else {
      savedCase = await offlineDb.cases.findByIdAndUpdate(caseId, {
        $set: {
          contradictions: contradictionsData,
          timeline: updatedTimeline
        }
      });
    }

    // Log audit action
    const logData = {
      action: 'CONTRADICTION_DETECTION',
      caseId: savedCase._id.toString(),
      userId: req.user.id,
      username: req.user.username,
      badge: req.user.badge,
      role: req.user.role,
      details: `Witness contradiction check executed. Identified ${results.contradictions.length} conflicts.`
    };

    if (!isOffline) {
      const auditLog = new AuditLog(logData);
      await auditLog.save();
    } else {
      await offlineDb.auditLogs.create(logData);
    }

    // Broadcast WebSocket updates
    if (req.io) {
      req.io.to(caseId).emit('caseUpdated', {
        case: savedCase,
        updatedBy: 'Contradiction Detector Agent',
        details: `Identified ${results.contradictions.length} witness contradictions.`
      });
    }

    res.json(results);
  } catch (err) {
    console.error('Witness contradictions check failed:', err);
    res.status(500).json({ message: 'Server error during contradiction analysis' });
  }
};

export const parseOcrText = async (req, res) => {
  const { ocrText } = req.body;

  if (!ocrText) {
    return res.status(400).json({ message: 'OCR extracted text is required' });
  }

  try {
    console.log('Extracting structured case fields from OCR text...');
    const extractedData = await extractOcrFields(ocrText);
    res.json(extractedData);
  } catch (err) {
    console.error('OCR field extraction parsing failed:', err);
    res.status(500).json({ message: 'Server error during OCR extraction parsing' });
  }
};
