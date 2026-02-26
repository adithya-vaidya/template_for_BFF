import { dataSourceManager } from '../datasources/dataSourceManager.js';
import { getFromCache, setInCache } from '../services/cacheService.js';

/**
 * DataSource Controller
 * Handles dynamic routing to different datasources with caching support
 */

export const dataSourceController = {
  /**
   * Call a specific datasource with optional caching
   */
  call: async (req, res) => {
    try {
      const {
        datasource,
        method = 'GET',
        path = '',
        body = null,
        headers = {},
        params = null,
        isToBeCached = false,
        cachingKeys = null
      } = req.body;

      // Validate required fields
      if (!datasource) {
        return res.status(400).json({
          status: 'error',
          message: 'datasource field is required',
          available: dataSourceManager.listDatasources()
        });
      }

      // Check cache if enabled
      if (isToBeCached && cachingKeys) {
        const cachedData = await getFromCache(cachingKeys);
        if (cachedData) {
          return res.status(200).json({
            status: 'success',
            data: cachedData,
            datasource: datasource,
            meta: {
              statusCode: 200,
              timestamp: new Date().toISOString(),
              fromCache: true,
              cacheKey: cachingKeys
            }
          });
        }
      }

      // Call the datasource
      const result = await dataSourceManager.callDatasource(datasource, {
        method: method.toUpperCase(),
        path,
        data: body,
        headers,
        params
      });

      // Cache the response if enabled
      if (isToBeCached && cachingKeys) {
        await setInCache(cachingKeys, result.data);
      }

      res.status(result.status || 200).json({
        status: 'success',
        data: result.data,
        datasource: result.datasource,
        meta: {
          statusCode: result.status,
          timestamp: new Date().toISOString(),
          fromCache: false,
          cached: isToBeCached && cachingKeys ? true : false,
          cacheKey: isToBeCached && cachingKeys ? cachingKeys : null
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        available: dataSourceManager.listDatasources()
      });
    }
  },

  /**
   * List all available datasources
   */
  list: async (req, res) => {
    try {
      const datasources = dataSourceManager.listDatasources();
      
      res.status(200).json({
        status: 'success',
        data: {
          total: datasources.length,
          datasources
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  },

  /**
   * Register new datasource at runtime
   */
  register: async (req, res) => {
    try {
      const { name, type, baseUrl, timeout, retryCount, headers } = req.body;

      // Validate required fields
      if (!name || !baseUrl) {
        return res.status(400).json({
          status: 'error',
          message: 'name and baseUrl are required'
        });
      }

      dataSourceManager.registerDatasource(name, {
        type,
        baseUrl,
        timeout,
        retryCount,
        headers
      });

      res.status(201).json({
        status: 'success',
        message: `DataSource '${name}' registered successfully`,
        datasource: dataSourceManager.getDatasource(name)
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  },

  /**
   * Unregister datasource
   */
  unregister: async (req, res) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          status: 'error',
          message: 'name field is required'
        });
      }

      const success = dataSourceManager.unregisterDatasource(name);

      if (!success) {
        return res.status(404).json({
          status: 'error',
          message: `DataSource '${name}' not found`
        });
      }

      res.status(200).json({
        status: 'success',
        message: `DataSource '${name}' unregistered successfully`
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }
};
