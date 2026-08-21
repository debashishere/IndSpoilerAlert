import { Router } from 'express';
import {
  getBuyerLists,
  getBuyerListById,
  createBuyerList,
  updateBuyerList,
  deleteBuyerList,
  updateBuyerListMembers,
} from '../controllers/buyerListController';
import { optionalAuthToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', optionalAuthToken, getBuyerLists);
router.get('/:id', getBuyerListById);
router.post('/', optionalAuthToken, createBuyerList);
router.put('/:id', updateBuyerList);
router.delete('/:id', deleteBuyerList);
router.put('/:id/members', updateBuyerListMembers);

export default router;
