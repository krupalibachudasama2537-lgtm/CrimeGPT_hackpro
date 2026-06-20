import express from 'express';
import { getCases, getCaseById, createCase, updateCase, deleteCase, verifyEvidence, signDocument, getAuditLogs } from '../controllers/caseController.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(auth); // Protect all case endpoints with JWT auth

router.get('/', getCases);
router.get('/audit/logs', getAuditLogs);
router.get('/:id', getCaseById);
router.post('/', requireRole(['io', 'sho']), createCase);
router.put('/:id', requireRole(['io', 'sho', 'legal']), updateCase);
router.delete('/:id', requireRole(['sho']), deleteCase);
router.post('/:id/verify-evidence', verifyEvidence);
router.post('/:id/sign', signDocument);

export default router;
