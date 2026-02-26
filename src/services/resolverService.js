import { dataSourceManager } from '../datasources/dataSourceManager.js';
import { getFromCache, setInCache } from './cacheService.js';

/**
 * Resolver Service
 * Executes unit and pipeline resolvers similar to AWS AppSync
 */

/**
 * Variable substitution in path/body/params
 * Supports:
 * - $prev - Output from previous step
 * - $steps.stepName - Output from named step
 * - $input.field - Input field from request
 */
function substituteVariables(value, input, context, stepName) {
  if (typeof value === 'string') {
    let result = value;

    // Replace $prev with previous step output
    if (context.previousOutput) {
      result = result.replace(/\$prev/g, JSON.stringify(context.previousOutput));
    }

    // Replace $steps.stepName with specific step output
    Object.entries(context.steps || {}).forEach(([name, output]) => {
      const regex = new RegExp(`\\$steps\\.${name}`, 'g');
      result = result.replace(regex, JSON.stringify(output));
    });

    // Replace $input.field with input values
    if (input) {
      Object.entries(input).forEach(([key, val]) => {
        const regex = new RegExp(`\\$input\\.${key}`, 'g');
        result = result.replace(regex, typeof val === 'string' ? val : JSON.stringify(val));
      });
    }

    // Try to parse if it looks like JSON
    if ((result.startsWith('{') || result.startsWith('[')) && result !== value) {
      try {
        return JSON.parse(result);
      } catch (e) {
        return result;
      }
    }

    return result;
  }

  if (typeof value === 'object' && value !== null) {
    const substituted = {};
    Object.entries(value).forEach(([key, val]) => {
      substituted[key] = substituteVariables(val, input, context, stepName);
    });
    return substituted;
  }

  return value;
}

/**
 * Execute a unit resolver (single datasource call)
 */
export async function executeUnitResolver(resolverConfig, input) {
  const {
    datasource,
    method = 'GET',
    path,
    body = null,
    headers = {},
    params = null,
    isToBeCached = false,
    cachingKeys = null
  } = resolverConfig;

  // Check cache if enabled
  if (isToBeCached && cachingKeys) {
    const cachedData = await getFromCache(cachingKeys);
    if (cachedData) {
      return {
        success: true,
        data: cachedData,
        datasource,
        fromCache: true,
        cacheKey: cachingKeys
      };
    }
  }

  try {
    // Call the datasource
    const result = await dataSourceManager.callDatasource(datasource, {
      method,
      path,
      data: body,
      headers,
      params
    });

    // Cache the response if enabled
    if (isToBeCached && cachingKeys) {
      await setInCache(cachingKeys, result.data);
    }

    return {
      success: true,
      data: result.data,
      datasource: result.datasource,
      fromCache: false,
      cached: isToBeCached && cachingKeys
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      datasource
    };
  }
}

/**
 * Execute a pipeline resolver (multiple datasource calls)
 * Steps are executed sequentially, context is passed between steps
 */
export async function executePipelineResolver(resolverConfig, input) {
  const {
    steps = [],
    onError = 'failFast',
    isToBeCached = false,
    cachingKeys = null
  } = resolverConfig;

  // Check cache for entire pipeline if enabled
  if (isToBeCached && cachingKeys) {
    const cachedData = await getFromCache(cachingKeys);
    if (cachedData) {
      return {
        success: true,
        data: cachedData,
        steps: [],
        fromCache: true,
        cacheKey: cachingKeys
      };
    }
  }

  const context = {
    previousOutput: null,
    steps: {}, // Named steps for reference
    input
  };

  const executedSteps = [];

  // Execute each step in the pipeline
  for (const stepConfig of steps) {
    const {
      name,
      datasource,
      method = 'GET',
      path: origPath,
      body: origBody,
      headers: origHeaders = {},
      params: origParams = null,
      isToBeCached: stepCached = false,
      cachingKeys: stepCachingKeys = null
    } = stepConfig;

    try {
      // Substitute variables in path, body, and params
      const substitutedPath = substituteVariables(origPath, input, context, name);
      const substitutedBody = substituteVariables(origBody, input, context, name);
      const substitutedHeaders = substituteVariables(origHeaders, input, context, name);
      const substitutedParams = substituteVariables(origParams, input, context, name);

      // Check step cache if enabled
      let stepData = null;
      let stepFromCache = false;

      if (stepCached && stepCachingKeys) {
        stepData = await getFromCache(stepCachingKeys);
        if (stepData) {
          stepFromCache = true;
        }
      }

      if (!stepFromCache) {
        // Call the datasource
        const result = await dataSourceManager.callDatasource(datasource, {
          method,
          path: substitutedPath,
          data: substitutedBody,
          headers: substitutedHeaders,
          params: substitutedParams
        });

        stepData = result.data;

        // Cache step result if enabled
        if (stepCached && stepCachingKeys) {
          await setInCache(stepCachingKeys, stepData);
        }
      }

      // Store step output in context
      context.previousOutput = stepData;
      context.steps[name] = stepData;

      executedSteps.push({
        name,
        success: true,
        data: stepData,
        datasource,
        fromCache: stepFromCache,
        cached: stepCached && stepCachingKeys
      });
    } catch (error) {
      const stepError = {
        name,
        success: false,
        error: error.message,
        datasource
      };

      executedSteps.push(stepError);

      // Handle error based on onError setting
      if (onError === 'failFast') {
        return {
          success: false,
          error: `Pipeline failed at step '${name}': ${error.message}`,
          steps: executedSteps,
          data: null
        };
      }
      // If 'continue', just log and proceed to next step
      console.warn(`⚠ Pipeline step '${name}' failed: ${error.message}`);
    }
  }

  const finalData = context.previousOutput; // Last step output is the result

  // Cache entire pipeline result if enabled
  if (isToBeCached && cachingKeys) {
    await setInCache(cachingKeys, finalData);
  }

  return {
    success: true,
    data: finalData,
    steps: executedSteps,
    fromCache: false,
    cached: isToBeCached && cachingKeys
  };
}

/**
 * Execute a resolver (unit or pipeline)
 */
export async function executeResolver(resolverConfig, input = {}) {
  const { type } = resolverConfig;

  if (type === 'unit') {
    return executeUnitResolver(resolverConfig, input);
  } else if (type === 'pipeline') {
    return executePipelineResolver(resolverConfig, input);
  } else {
    throw new Error(`Unknown resolver type: ${type}`);
  }
}
