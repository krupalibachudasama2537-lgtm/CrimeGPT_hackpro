import Case from '../models/case.js';
import AuditLog from '../models/auditLog.js';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { offlineDb } from '../services/offlineStorage.js';

// Helper: Generate SHA-256 hash for evidence
function generateEvidenceHash(item, caseId) {
  const dataString = `${item.name}-${item.description}-${item.quantity}-${item.value}-${item.timestamp}-${caseId}`;
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

// Log audit actions helper
async function logAction(req, action, caseId, details) {
  try {
    const isOffline = mongoose.connection.readyState !== 1;
    if (!isOffline) {
      const audit = new AuditLog({
        action,
        caseId,
        userId: req.user.id,
        username: req.user.username,
        badge: req.user.badge,
        role: req.user.role,
        details
      });
      await audit.save();
    } else {
      await offlineDb.auditLogs.create({
        action,
        caseId,
        userId: req.user.id,
        username: req.user.username,
        badge: req.user.badge,
        role: req.user.role,
        details
      });
    }
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
}

export const getCases = async (req, res) => {
  try {
    const isOffline = mongoose.connection.readyState !== 1;
    let cases;
    if (!isOffline) {
      cases = await Case.find().sort({ updatedAt: -1 });
    } else {
      cases = await offlineDb.cases.find();
    }
    res.json(cases);
  } catch (err) {
    console.error('Fetch cases failed:', err);
    res.status(500).json({ message: 'Server error retrieving cases' });
  }
};

export const getCaseById = async (req, res) => {
  try {
    const isOffline = mongoose.connection.readyState !== 1;
    let caseItem;
    if (!isOffline) {
      caseItem = await Case.findById(req.params.id);
      if (!caseItem) {
        // Fallback: look up by FIR Number
        caseItem = await Case.findOne({ firNo: req.params.id });
      }
    } else {
      caseItem = await offlineDb.cases.findById(req.params.id);
    }

    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }
    res.json(caseItem);
  } catch (err) {
    console.error('Fetch case failed:', err);
    res.status(500).json({ message: 'Server error retrieving case' });
  }
};

export const createCase = async (req, res) => {
  const caseData = req.body;

  if (!caseData.firNo || !caseData.station || !caseData.narrative) {
    return res.status(400).json({ message: 'FIR No, Police Station, and Narrative are required' });
  }

  try {
    const isOffline = mongoose.connection.readyState !== 1;
    let existingCase;
    if (!isOffline) {
      existingCase = await Case.findOne({ firNo: caseData.firNo });
    } else {
      existingCase = await offlineDb.cases.findOne({ firNo: caseData.firNo });
    }

    if (existingCase) {
      return res.status(400).json({ message: `Case with FIR No ${caseData.firNo} already exists` });
    }

    // Set initial timelines and default deadlines
    const initialTimeline = caseData.timeline || [
      {
        id: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        event: `FIR registered electronically under Sec 173 BNSS. Narrative logged.`,
        type: 'complaint'
      }
    ];

    const initialDeadlines = caseData.deadlines || [
      {
        title: "Accused Medical Exam Due",
        type: "medical",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 24 hours
        status: "pending",
        colorCode: "red"
      },
      {
        title: "Magistrate Presentation Due",
        type: "remand",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 24 hours
        status: "pending",
        colorCode: "red"
      },
      {
        title: "Filing Chargesheet Deadline",
        type: "chargesheet",
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days
        status: "pending",
        colorCode: "yellow"
      }
    ];

    let seizedItems = caseData.seizedItems || [];
    if (seizedItems.length > 0) {
      seizedItems = seizedItems.map(item => {
        const timestamp = item.timestamp || new Date().toLocaleString();
        const hash = generateEvidenceHash(item, caseData.firNo);
        return {
          ...item,
          timestamp,
          hash,
          verificationStatus: 'Secured'
        };
      });
    }

    let savedCase;
    if (!isOffline) {
      const newCase = new Case({
        ...caseData,
        ioName: req.user.name,
        ioBadge: req.user.badge,
        timeline: initialTimeline,
        deadlines: initialDeadlines,
        seizedItems
      });
      await newCase.save();
      savedCase = newCase;
    } else {
      savedCase = await offlineDb.cases.create({
        ...caseData,
        ioName: req.user.name,
        ioBadge: req.user.badge,
        timeline: initialTimeline,
        deadlines: initialDeadlines,
        seizedItems
      });
    }

    await logAction(req, 'CREATE_CASE', savedCase._id.toString(), `Registered case ${savedCase.firNo}`);
    res.status(201).json(savedCase);
  } catch (err) {
    console.error('Create case failed:', err);
    res.status(500).json({ message: 'Server error during case registration' });
  }
};

export const updateCase = async (req, res) => {
  try {
    const caseId = req.params.id;
    const isOffline = mongoose.connection.readyState !== 1;
    let existingCase;
    if (!isOffline) {
      existingCase = await Case.findById(caseId);
    } else {
      existingCase = await offlineDb.cases.findById(caseId);
    }

    if (!existingCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Capture changes for logs and audit trail
    const oldStatus = existingCase.accused?.status;
    const newStatus = req.body.accused?.status;

    // Recalculate hash for any new evidence items
    if (req.body.seizedItems) {
      req.body.seizedItems = req.body.seizedItems.map(item => {
        if (!item.hash) {
          const timestamp = item.timestamp || new Date().toLocaleString();
          const hash = generateEvidenceHash(item, existingCase.firNo);
          return { ...item, hash, timestamp, verificationStatus: 'Secured' };
        }
        return item;
      });
    }

    let updatedCase;
    if (!isOffline) {
      updatedCase = await Case.findByIdAndUpdate(
        caseId,
        { $set: req.body },
        { new: true, runValidators: true }
      );
    } else {
      updatedCase = await offlineDb.cases.findByIdAndUpdate(caseId, { $set: req.body });
    }

    // Audit logs
    let details = 'Updated case data';
    if (oldStatus !== newStatus && newStatus) {
      details = `Status of accused ${updatedCase.accused?.name} changed from '${oldStatus}' to '${newStatus}'`;
    }
    await logAction(req, 'UPDATE_CASE', caseId, details);

    // Emit live WebSocket update to all users viewing this case
    if (req.io) {
      req.io.to(caseId).emit('caseUpdated', {
        case: updatedCase,
        updatedBy: req.user.name,
        details
      });
    }

    res.json(updatedCase);
  } catch (err) {
    console.error('Update case failed:', err);
    res.status(500).json({ message: 'Server error during case update' });
  }
};

export const deleteCase = async (req, res) => {
  try {
    const caseId = req.params.id;
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

    if (!isOffline) {
      await Case.findByIdAndDelete(caseId);
    } else {
      await offlineDb.cases.findByIdAndDelete(caseId);
    }
    
    await logAction(req, 'DELETE_CASE', caseId, `Deleted case ${caseItem.firNo}`);

    if (req.io) {
      req.io.emit('caseDeleted', { caseId, firNo: caseItem.firNo });
    }

    res.json({ message: `Case ${caseItem.firNo} deleted successfully` });
  } catch (err) {
    console.error('Delete case failed:', err);
    res.status(500).json({ message: 'Server error during case deletion' });
  }
};

// Chain of Custody Hash Verification
export const verifyEvidence = async (req, res) => {
  try {
    const caseId = req.params.id;
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

    let tampered = false;
    const reports = [];

    // Map and recalculate
    const updatedSeizedItems = caseItem.seizedItems.map(item => {
      const recalculatedHash = generateEvidenceHash(item, caseItem.firNo);
      const isOk = (item.hash === recalculatedHash);
      
      let status = item.verificationStatus;
      if (!isOk) {
        status = 'Tampered';
        tampered = true;
      } else {
        status = 'Verified';
      }

      reports.push({
        itemId: item.id,
        name: item.name,
        storedHash: item.hash,
        computedHash: recalculatedHash,
        status: status
      });

      const itemData = (typeof item.toObject === 'function') ? item.toObject() : item;
      return {
        ...itemData,
        verificationStatus: status
      };
    });

    let savedCase;
    if (!isOffline) {
      caseItem.seizedItems = updatedSeizedItems;
      await caseItem.save();
      savedCase = caseItem;
    } else {
      savedCase = await offlineDb.cases.findByIdAndUpdate(caseId, { $set: { seizedItems: updatedSeizedItems } });
    }

    await logAction(req, 'VERIFY_EVIDENCE', caseId, `Executed chain of custody integrity audit. Tampering detected: ${tampered}`);

    // Broadcast if status changed
    if (req.io) {
      req.io.to(caseId).emit('caseUpdated', {
        case: savedCase,
        updatedBy: 'System Integrity Audit',
        details: 'Recalculated cryptographic evidence hashes.'
      });
    }

    res.json({
      tampered,
      reports,
      caseData: savedCase
    });
  } catch (err) {
    console.error('Evidence verification failed:', err);
    res.status(500).json({ message: 'Server error during integrity audit' });
  }
};

// Add Signature / Signature verification
export const signDocument = async (req, res) => {
  const { docType } = req.body; // 'chargesheet', 'seizure', 'remand', 'panchanama'
  
  try {
    const caseId = req.params.id;
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

    const timestamp = new Date().toLocaleString();
    let logEvent = '';

    if (req.user.role === 'io') {
      logEvent = `Investigating Officer ${req.user.name} signed ${docType.toUpperCase()} at ${timestamp}`;
    } else if (req.user.role === 'sho') {
      logEvent = `Station House Officer ${req.user.name} approved and signed ${docType.toUpperCase()} at ${timestamp}`;
    } else if (req.user.role === 'legal') {
      logEvent = `Legal Advisor ${req.user.name} verified compliance & stamped ${docType.toUpperCase()} at ${timestamp}`;
    }

    // Append signature log to case timeline
    const updatedTimeline = [...caseItem.timeline, {
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      event: logEvent,
      type: 'document'
    }];

    let savedCase;
    if (!isOffline) {
      caseItem.timeline = updatedTimeline;
      await caseItem.save();
      savedCase = caseItem;
    } else {
      savedCase = await offlineDb.cases.findByIdAndUpdate(caseId, { $set: { timeline: updatedTimeline } });
    }

    await logAction(req, 'SIGN_DOCUMENT', caseId, `Signed document ${docType}`);

    if (req.io) {
      req.io.to(caseId).emit('caseUpdated', {
        case: savedCase,
        updatedBy: req.user.name,
        details: logEvent
      });
    }

    res.json(savedCase);
  } catch (err) {
    console.error('Sign document failed:', err);
    res.status(500).json({ message: 'Server error during document signature' });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const isOffline = mongoose.connection.readyState !== 1;
    let logs;
    if (!isOffline) {
      logs = await AuditLog.find().sort({ timestamp: -1 });
    } else {
      logs = await offlineDb.auditLogs.find();
    }
    res.json(logs);
  } catch (err) {
    console.error('Fetch audit logs failed:', err);
    res.status(500).json({ message: 'Server error retrieving audit logs' });
  }
};
