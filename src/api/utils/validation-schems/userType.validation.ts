import Joi from "joi";

export const createUserTypeSchema = Joi.object({
  typeName: Joi.string().required().min(1).max(100).messages({
    "string.empty": "User type name is required",
    "string.min": "User type name must be at least 1 character",
    "string.max": "User type name must not exceed 100 characters"
  }),
  companyId: Joi.string().required(), // Will be set from authenticated user
  eventId: Joi.string().optional().allow(null, "")
});

export const updateUserTypeSchema = Joi.object({
  typeName: Joi.string().min(1).max(100).messages({
    "string.min": "User type name must be at least 1 character",
    "string.max": "User type name must not exceed 100 characters"
  }),
  companyId: Joi.string().required(),
  eventId: Joi.string().optional().allow(null, ""),
  id: Joi.string().optional()
});