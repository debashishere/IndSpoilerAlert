import { Router } from 'express';
import {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  compileEmailTemplate
} from '../controllers/emailTemplateController';

const router = Router();

router.get('/', getEmailTemplates);
router.post('/', createEmailTemplate);
router.post('/compile', compileEmailTemplate);
router.put('/:id', updateEmailTemplate);
router.delete('/:id', deleteEmailTemplate);

export default router;
