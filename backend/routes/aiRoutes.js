import express from 'express';
import { analyzeNarrativeStream, auditCase, checkContradictions, parseOcrText } from '../controllers/aiController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth); // Protect all AI services with JWT auth

router.post('/analyze', analyzeNarrativeStream);
router.post('/:id/audit', auditCase);
router.post('/:id/contradictions', checkContradictions);
router.post('/ocr-parse', parseOcrText);

export default router;
