import { createApp } from './src/app.js';
import authRoutes from './src/routes/authRoutes.js';
import dataSourceRoutes from './src/routes/dataSourceRoutes.js';
import { validateRequest } from './src/middleware/validationMiddleware.js';
import { dataSourceManager } from './src/datasources/dataSourceManager.js';
import { 
  initializeRedis, 
  getFromCache, 
  setInCache, 
  deleteFromCache, 
  clearCacheByPattern, 
  isRedisConnectedStatus, 
  disconnectRedis 
} from './src/services/cacheService.js';

export { 
  createApp, 
  authRoutes, 
  dataSourceRoutes, 
  validateRequest, 
  dataSourceManager,
  initializeRedis,
  getFromCache,
  setInCache,
  deleteFromCache,
  clearCacheByPattern,
  isRedisConnectedStatus,
  disconnectRedis
}; 

// Default export for convenience
export default { 
  createApp, 
  authRoutes, 
  dataSourceRoutes, 
  validateRequest, 
  dataSourceManager,
  initializeRedis,
  getFromCache,
  setInCache,
  deleteFromCache,
  clearCacheByPattern,
  isRedisConnectedStatus,
  disconnectRedis
};