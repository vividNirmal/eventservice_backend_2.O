import Joi from "joi";

export const createBadgeCategorySchema = Joi.object({
  name: Joi.string().required().min(1).max(100).messages({
    "string.empty": "Category name is required",
    "string.min": "Category name must be at least 1 character",
    "string.max": "Category name must not exceed 100 characters",
  }),
  code: Joi.string().allow("", null),
  priority: Joi.number().required().messages({
    "number.base": "Priority must be a number",
    "any.required": "Priority is required",
  }),
  backgroundColor: Joi.string().required().messages({
    "string.empty": "Background color is required",
  }),
  textColor: Joi.string().required().messages({
    "string.empty": "Text color is required",
  }),
  description: Joi.string().allow("", null),
  companyId: Joi.string().optional(),
  eventId: Joi.string().required().messages({
    "string.empty": "Event ID is required",
  }),
});

export const updateBadgeCategorySchema = Joi.object({
  name: Joi.string().min(1).max(100).messages({
    "string.min": "Category name must be at least 1 character",
    "string.max": "Category name must not exceed 100 characters",
  }),
  code: Joi.string().allow("", null),
  priority: Joi.number().optional(),
  backgroundColor: Joi.string().optional(),
  textColor: Joi.string().optional(),
  description: Joi.string().allow("", null),
  companyId: Joi.string().optional(),
  eventId: Joi.string().optional(),
  id: Joi.string().optional(),
});
