import Joi from "joi";

export const createExhibitorFormConfigurationSchema = Joi.object({
  formNo: Joi.string().required().max(20).messages({
    "string.empty": "Form number is required",
    "string.max": "Form number must not exceed 20 characters",
  }),
  configName: Joi.string().required().min(2).max(100).messages({
    "string.empty": "Configuration name is required",
    "string.min": "Configuration name must be at least 2 characters",
    "string.max": "Configuration name must not exceed 100 characters",
  }),
  configSlug: Joi.string()
    .required()
    .pattern(/^[a-z0-9_-]+$/)
    .messages({
      "string.pattern.base": "Slug must contain only lowercase letters, numbers, underscores or dashes",
      "string.empty": "Slug is required",
    }),
  hasParticulars: Joi.boolean().optional(),
});

export const updateExhibitorFormConfigurationSchema = Joi.object({
  formNo: Joi.string().max(20),
  configName: Joi.string().min(2).max(100),
  configSlug: Joi.string().pattern(/^[a-z0-9_-]+$/),
  hasParticulars: Joi.boolean(),
  id: Joi.string().optional(),
});
