import { executeResolver } from '../services/resolverService.js';

/**
 * Resolver Controller
 * Handles unit and pipeline resolver execution (AppSync-like)
 */

export const resolverController = {
  /**
   * POST /api/resolvers
   * Execute a resolver (unit or pipeline)
   * 
   * Request body:
   * - type: 'unit' | 'pipeline' (required)
   * - If unit: datasource, method, path, body, headers, params
   * - If pipeline: steps (array of datasource calls), onError
   * - isToBeCached: boolean (caches entire result)
   * - cachingKeys: string (cache key)
   */
  execute: async (req, res) => {
    try {
      const { type } = req.body;

      if (!type) {
        return res.status(400).json({
          status: 'error',
          message: 'type field is required (unit | pipeline)'
        });
      }

      // Extract input fields (for variable substitution in pipeline)
      const input = req.body;

      // Execute the resolver
      const result = await executeResolver(req.body, input);

      if (!result.success) {
        return res.status(500).json({
          status: 'error',
          message: result.error,
          steps: result.steps
        });
      }

      res.status(200).json({
        status: 'success',
        data: type === 'pipeline' ? result.steps : result.data,
        meta: {
          timestamp: new Date().toISOString(),
          type: type,
          // resolverChain: type === 'pipeline' ? result.steps : undefined,
          fromCache: result.fromCache,
          cached: result.cached,
          cacheKey: result.cacheKey
        }
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  },

  /**
   * POST /api/resolvers/test
   * Test a resolver without caching
   * Returns detailed execution information for debugging
   */
  test: async (req, res) => {
    try {
      const { type } = req.body;

      if (!type) {
        return res.status(400).json({
          status: 'error',
          message: 'type field is required (unit | pipeline)'
        });
      }

      // Disable caching for test
      const testConfig = { ...req.body, isToBeCached: false };
      const input = req.body;

      // Execute the resolver
      const result = await executeResolver(testConfig, input);

      if (!result.success) {
        return res.status(500).json({
          status: 'error',
          message: result.error,
          steps: result.steps,
          timestamp: new Date().toISOString()
        });
      }

      res.status(200).json({
        status: 'success',
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          type: type,
          resolverChain: type === 'pipeline' ? result.steps : undefined,
          message: 'Test execution (caching disabled)'
        }
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * GET /api/resolvers/docs
   * Get resolver documentation and examples
   */
  docs: async (req, res) => {
    res.status(200).json({
      status: 'success',
      data: {
        title: 'AppSync-like Resolver System',
        description: 'Execute unit or pipeline resolvers with variable substitution',
        endpoints: {
          execute: {
            path: 'POST /api/resolvers',
            description: 'Execute any resolver (unit or pipeline)',
            caching: 'Supported'
          },
          test: {
            path: 'POST /api/resolvers/test',
            description: 'Test resolver without caching (debugging)',
            caching: 'Disabled'
          }
        },
        resolverTypes: {
          unit: {
            description: 'Single datasource call',
            example: {
              type: 'unit',
              datasource: 'USER_SERVICE',
              method: 'GET',
              path: '/users/1',
              isToBeCached: true,
              cachingKeys: 'users:1'
            }
          },
          pipeline: {
            description: 'Multiple datasource calls with variable substitution',
            variableSupport: {
              $prev: 'Output from previous step',
              '$steps.stepName': 'Output from specific named step',
              '$input.fieldName': 'Input field from request'
            },
            example: {
              type: 'pipeline',
              onError: 'failFast',
              steps: [
                {
                  name: 'getUser',
                  datasource: 'USER_SERVICE',
                  method: 'GET',
                  path: '/users/1'
                },
                {
                  name: 'getUserPosts',
                  datasource: 'POST_SERVICE',
                  method: 'GET',
                  path: '/posts?userId=$prev.id'
                },
                {
                  name: 'getComments',
                  datasource: 'COMMENT_SERVICE',
                  method: 'GET',
                  path: '/comments?postId=$steps.getUserPosts[0].id'
                }
              ]
            }
          }
        }
      }
    });
  }
};
