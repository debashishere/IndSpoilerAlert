import { Router } from 'express';
import {
  getBuyerLists,
  getBuyerListById,
  createBuyerList,
  updateBuyerList,
  deleteBuyerList,
  updateBuyerListMembers,
} from '../controllers/buyerListController';

const router = Router();

router.get('/', getBuyerLists);
router.get('/:id', getBuyerListById);
router.post('/', createBuyerList);
router.put('/:id', updateBuyerList);
router.delete('/:id', deleteBuyerList);
router.put('/:id/members', updateBuyerListMembers);

export default router;
