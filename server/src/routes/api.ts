import { Router } from 'express';
import { router as childrenRouter } from './children';
import { router as usageRouter } from './usage';
import { router as conversationsRouter } from './conversations';

export const router = Router();
router.use('/children', childrenRouter);
router.use('/usage', usageRouter);
router.use('/conversations', conversationsRouter);
