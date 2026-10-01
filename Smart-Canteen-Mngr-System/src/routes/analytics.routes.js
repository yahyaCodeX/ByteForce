// src/routes/analytics.routes.js
import { Router } from 'express';
import { getDashboardStats } from '../controllers/analytics.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { checkRole } from '../middleware/checkRole.js';

const router = Router();

router.use(verifyToken);
router.use(checkRole(['MANAGER', 'ADMIN'])); // Only managers/admins can view dashboard

// GET /api/analytics/dashboard
router.get('/dashboard', getDashboardStats);

export default router;
