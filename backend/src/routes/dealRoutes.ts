import { Router } from 'express';
import { optionalAuthToken } from '../middleware/authMiddleware';
import * as dealsController from '../controllers/dealsController';

const router = Router();

// GET /api/deals/:dealId - Hybrid deal authorization (token or session)
router.get('/:dealId', optionalAuthToken, dealsController.getDealById);

// POST /api/deals/:dealId/confirm-payment - Payment Gate confirmation
router.post('/:dealId/confirm-payment', optionalAuthToken, dealsController.confirmPayment);

// POST /api/deals/:dealId/sign - Step 2 Agreement & E-Sign execution
router.post('/:dealId/sign', optionalAuthToken, dealsController.signDeal);

// GET /api/deals/:dealId/pdf - Compile and stream authoritative B2B agreement PDF
router.get('/:dealId/pdf', optionalAuthToken, dealsController.streamDealPdf);

export default router;
