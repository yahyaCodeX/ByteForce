// src/routes/menu.routes.js
import { Router } from 'express';
import { getMenu, getMenuItem, getPickupSlots, updateItemStatus } from '../controllers/menu.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { checkRole }   from '../middleware/checkRole.js';

const router = Router();

// ── Public ────────────────────────────────────────────────────────
// GET /api/menu             — Browse available menu (with filters)
router.get('/', getMenu);

// GET /api/menu/slots       — Available pickup time slots
router.get('/slots', getPickupSlots);

// GET /api/menu/:itemId     — Single item detail
router.get('/:itemId', getMenuItem);

// ── Protected: Staff & Manager only ───────────────────────────────
// PATCH /api/menu/:itemId/status — Toggle item availability
router.patch(
  '/:itemId/status',
  verifyToken,
  checkRole(['STAFF', 'MANAGER', 'ADMIN']),
  updateItemStatus
);

export default router;
