import Joi from "joi";

export const createEBadgeTemplateSchema = Joi.object({
  name: Joi.string().required().min(1).max(100).messages({
    "string.empty": "Template name is required",
    "string.min": "Template name must be at least 1 character",
    "string.max": "Template name must not exceed 100 characters",
  }),
  htmlContent: Joi.string().required().messages({
    "string.empty": "HTML content is required",
  }),
  eventId: Joi.string().required().messages({
    "string.empty": "eventId content is required",
  }),
  companyId: Joi.string().optional(),
});

export const updateEBadgeTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(100).messages({
    "string.min": "Template name must be at least 1 character",
    "string.max": "Template name must not exceed 100 characters",
  }),
  htmlContent: Joi.string().optional(),
  eventId: Joi.string().optional(),
  companyId: Joi.string().optional(),
  id: Joi.string().optional(),
});
