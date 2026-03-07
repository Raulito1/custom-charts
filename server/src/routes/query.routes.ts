import { Router } from 'express';
import { executeQuery } from '../controllers/query.controller';

const router = Router();
router.post('/', executeQuery);

export default router;
