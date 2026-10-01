// src/routes/auth.routes.js
// Authentication Routes: /api/auth

import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = Router();

// POST /api/auth/register  — Public
router.post('/register', register);

// POST /api/auth/login     — Public
router.post('/login', login);

// GET  /api/auth/me        — Protected
router.get('/me', verifyToken, getMe);

export default router;
