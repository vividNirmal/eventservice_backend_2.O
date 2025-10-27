import Joi from "joi";

export const createfieldConstantSchema = Joi.object({
  param_name: Joi.string().required().min(1).max(100).messages({
    "string.empty": "User type name is required",
    "string.min": "User type name must be at least 1 character",
    "string.max": "User type name must not exceed 100 characters"
  })
});

export const updateFieldConstantSchema = Joi.object({
  param_name: Joi.string().min(1).max(100).messages({
    "string.min": "User type name must be at least 1 character",
    "string.max": "User type name must not exceed 100 characters"
  }),
  id: Joi.string().optional()
});