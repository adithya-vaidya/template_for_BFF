import express from 'express';
import { dataSourceController } from '../controllers/dataSourceController.js';
import { datasourceSchema } from '../validators/dataSourceValidator.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
// import { resolverController } from '../../../bff-core/src/controllers/resolverController.js';

const router = express.Router();

/**
 * DataSource Routes (AppSync-like plugin architecture)
 * 
 * GET  /datasources - List all available datasources
 * POST /datasources/call - Call a specific datasource
 * POST /datasources/register - Register new datasource at runtime
 * POST /datasources/unregister - Unregister a datasource
 */

// List all datasources
router.get('/datasources', dataSourceController.list);

// Call a datasource with resolver technique
// router.get('/resolver', resolverController.execute);

// Call a datasource dynamically
router.post('/datasources/call', validateRequest(datasourceSchema), dataSourceController.call);

// Register new datasource at runtime
router.post('/datasources/register', dataSourceController.register);

// Unregister a datasource
router.post('/datasources/unregister', dataSourceController.unregister);

export default router;
