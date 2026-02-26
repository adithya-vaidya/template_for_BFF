import joi from 'joi';

/**
 * Resolver Validator
 * Joi schemas for unit and pipeline resolvers (AppSync-like)
 */

// Schema for a single datasource call step
const stepSchema = joi.object({
  name: joi.string().alphanum().required(),
  datasource: joi.string().required(),
  method: joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').default('GET'),
  path: joi.string().required(),
  body: joi.when('method', {
    is: joi.string().valid('POST', 'PUT', 'PATCH'),
    then: joi.alternatives().try(
      joi.object(),
      joi.string() // Allow string with variable substitution like "$prev.id"
    ).optional(),
    otherwise: joi.object().optional()
  }),
  headers: joi.object().optional(),
  params: joi.object().optional(),
  isToBeCached: joi.boolean().default(false),
  cachingKeys: joi.when('isToBeCached', {
    is: true,
    then: joi.string().required(),
    otherwise: joi.string().optional()
  })
});

// Unit resolver schema
export const unitResolverSchema = joi.object({
  type: joi.string().valid('unit').required(),
  datasource: joi.string().required(),
  method: joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').default('GET'),
  path: joi.string().required(),
  body: joi.when('method', {
    is: joi.string().valid('POST', 'PUT', 'PATCH'),
    then: joi.object().required(),
    otherwise: joi.object().optional()
  }),
  headers: joi.object().optional(),
  params: joi.object().optional(),
  isToBeCached: joi.boolean().default(false),
  cachingKeys: joi.when('isToBeCached', {
    is: true,
    then: joi.string().required(),
    otherwise: joi.string().optional()
  })
});

// Pipeline resolver schema
export const pipelineResolverSchema = joi.object({
  type: joi.string().valid('pipeline').required(),
  steps: joi.array().items(stepSchema).min(1).required(),
  onError: joi.string().valid('failFast', 'continue').default('failFast'), // How to handle step failures
  isToBeCached: joi.boolean().default(false),
  cachingKeys: joi.when('isToBeCached', {
    is: true,
    then: joi.string().required(),
    otherwise: joi.string().optional()
  })
});

// Combined resolver schema (accepts both unit and pipeline)
export const resolverSchema = joi.alternatives().try(
  unitResolverSchema,
  pipelineResolverSchema
);
