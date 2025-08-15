import { Router } from 'express';
import { router as childrenRouter } from './children';
import { router as usageRouter } from './usage';
import { router as conversationsRouter } from './conversations';
import { router as historyRouter } from './history';

export const router = Router();
router.use('/children', childrenRouter);
router.use('/usage', usageRouter);
router.use('/conversations', conversationsRouter);
router.use('/history', historyRouter);
