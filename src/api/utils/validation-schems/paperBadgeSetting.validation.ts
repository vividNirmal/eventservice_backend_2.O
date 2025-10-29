import Joi from "joi";

export const createPaperBadgeSettingSchema = Joi.object({
  name: Joi.string().required().min(1).max(100).messages({
    "string.empty": "Setting name is required",
    "string.min": "Setting name must be at least 1 character",
    "string.max": "Setting name must not exceed 100 characters",
  }),
  ticketIds: Joi.array().items(Joi.string()).optional(),
  eventId: Joi.string().required().messages({
    "string.empty": "Event ID is required",
  }),
  companyId: Joi.string().optional(),
});

export const updatePaperBadgeSettingSchema = Joi.object({
  name: Joi.string().min(1).max(100).messages({
    "string.min": "Setting name must be at least 1 character",
    "string.max": "Setting name must not exceed 100 characters",
  }),
  ticketIds: Joi.array().items(Joi.string()).optional(),
  eventId: Joi.string().optional(),
  companyId: Joi.string().optional(),
  id: Joi.string().optional(),
});

export const updatePaperBadgeSettingPropertiesSchema = Joi.object({
  id: Joi.string().optional(),
  fields: Joi.array().optional(),
  fieldProperties: Joi.object().optional(),
});