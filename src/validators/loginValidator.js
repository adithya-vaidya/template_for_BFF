import Joi from 'joi';

export const loginSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).required()
});

export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(50).required()
});

export const refreshTokenSchema = Joi.object({
  token: Joi.string().required()
});
