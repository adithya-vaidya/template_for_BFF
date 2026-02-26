import express from 'express';
import { authController } from '../controllers/authController.js';
import { loginSchema, registerSchema, refreshTokenSchema } from '../validators/loginValidator.js';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Auth routes
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/logout', authController.logout);
router.post('/refresh-token', validateRequest(refreshTokenSchema), authController.refreshToken);

export default router;
