import { Router } from 'express';
import * as portalController from '../controllers/portalController';

const router = Router();

// GET /api/portal/negotiation/:offerId - Guest Buyer Negotiation Portal context
router.get('/negotiation/:offerId', portalController.getNegotiationPortal);

// POST /api/portal/negotiation/:offerId/re-bid - Buyer submits revised counter-proposal
router.post('/negotiation/:offerId/re-bid', portalController.submitRebid);

// POST /api/portal/negotiation/:offerId/accept - Buyer accepts supplier counter-proposal
router.post('/negotiation/:offerId/accept', portalController.acceptCounterProposal);

export default router;
