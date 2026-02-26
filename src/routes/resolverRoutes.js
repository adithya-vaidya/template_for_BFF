import express from 'express';
import { resolverController } from '../controllers/resolverController.js';
import { resolverSchema } from '../validators/resolverValidator.js';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

/**
 * Resolver Routes
 * AppSync-like unit and pipeline resolver endpoints
 * 
 * POST  /api/resolvers        - Execute resolver (unit or pipeline)
 * POST  /api/resolvers/test   - Test resolver (no caching)
 * GET   /api/resolvers/docs   - Resolver documentation
 */

// Execute resolver (unit or pipeline)
router.post('/resolverss', validateRequest(resolverSchema), resolverController.execute);

// Test resolver (for debugging, disables caching)
router.post('/resolvers/test', validateRequest(resolverSchema), resolverController.test);

// Get resolver documentation
router.get('/resolvers/docs', resolverController.docs);

export default router;
