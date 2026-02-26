import joi from 'joi';

export const datasourceSchema = joi.object({
    datasource: joi.string().required(),
    path: joi.string().required(),
    body: joi.when('method', {
      is: joi.string().valid('POST', 'PUT', 'PATCH'),
      then: joi.object().required(),
      otherwise: joi.object().optional()
    }),
    headers: joi.object().optional(),
    params: joi.object().optional(),
    method: joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').default('GET'),
    isToBeCached: joi.boolean().default(false),
    cachingKeys: joi.when('isToBeCached', {
      is: true,
      then: joi.string().required(),
      otherwise: joi.string().optional()
    })
})