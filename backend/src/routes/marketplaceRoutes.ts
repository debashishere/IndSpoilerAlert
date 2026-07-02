import { Router } from 'express';
import * as marketplaceController from '../controllers/marketplaceController';
import * as generalController from '../controllers/generalController';
import * as buyerAuthController from '../controllers/buyerAuthController';

const marketplaceRouter = Router();

marketplaceRouter.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', namespace: 'marketplace' });
});

// Buyer Authentication Routes
marketplaceRouter.post('/auth/send-verification', buyerAuthController.sendVerification);
marketplaceRouter.post('/auth/verify-token', buyerAuthController.verifyToken);
marketplaceRouter.get('/auth/session', buyerAuthController.getSession);
marketplaceRouter.post('/auth/logout', buyerAuthController.logout);

// Marketplace Core Routes
marketplaceRouter.get('/buyers', generalController.getBuyers);
marketplaceRouter.post('/buyers', generalController.createBuyer);
marketplaceRouter.get('/listings', marketplaceController.getListings);
marketplaceRouter.get('/listing/:id/matches', marketplaceController.recommendBuyers);
marketplaceRouter.post('/bids', marketplaceController.placeBid);
marketplaceRouter.post('/listing/:id/bids', marketplaceController.placeBid);

export default marketplaceRouter;
