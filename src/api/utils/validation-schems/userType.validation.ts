import Joi from "joi";

export const createUserTypeSchema = Joi.object({
  typeName: Joi.string().required().min(1).max(100).messages({
    "string.empty": "User type name is required",
    "string.min": "User type name must be at least 1 character",
    "string.max": "User type name must not exceed 100 characters"
  }),
  order: Joi.number().optional().messages({
    "number.base": "Order must be a number"
  })
});

export const updateUserTypeSchema = Joi.object({
  typeName: Joi.string().min(1).max(100).messages({
    "string.min": "User type name must be at least 1 character",
    "string.max": "User type name must not exceed 100 characters"
  }),
  id: Joi.string().optional(),
  order: Joi.number().optional().messages({
    "number.base": "Order must be a number"
  })
});