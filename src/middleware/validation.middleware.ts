import { Request, Response, NextFunction } from "express";
import Joi from "joi";

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      res.status(400).json({ error: message });
      return;
    }
    next();
  };
};

export const schemas = {
  signup: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
  }),

  signin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  transfer: Joi.object({
    toAccountNumber: Joi.string().length(10).pattern(/^\d+$/).required(),
    amount: Joi.number().positive().precision(2).required(),
    description: Joi.string().max(255).optional(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  topup: Joi.object({
    amount: Joi.number().positive().precision(2).required(),
  }),
};
