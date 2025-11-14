// domain/validation/userCampaign.validation.js
import Joi from "joi";

export const createUserCampaignSchema = Joi.object({
  name: Joi.string().required().min(1).max(150).messages({
    "string.empty": "Campaign name is required",
    "string.min": "Campaign name must be at least 1 character",
    "string.max": "Campaign name must not exceed 150 characters",
  }),
  templateId: Joi.string().required().messages({
    "string.empty": "Template ID is required",
  }),
  scheduled: Joi.boolean().default(false),
  scheduledAt: Joi.date().when('scheduled', {
    is: true,
    then: Joi.date().greater('now').required().messages({
      'date.greater': 'Schedule date must be in the future',
      'any.required': 'Schedule date is required when scheduled is enabled'
    }),
    otherwise: Joi.optional()
  }),
  eventId: Joi.string().required().messages({
    "string.empty": "Event ID is required",
  }),
  companyId: Joi.string().required().messages({
    "string.empty": "Company ID is required",
  }),
});

export const updateUserCampaignSchema = Joi.object({
  name: Joi.string().min(1).max(150).messages({
    "string.min": "Campaign name must be at least 1 character",
    "string.max": "Campaign name must not exceed 150 characters",
  }),
  templateId: Joi.string().optional(),
  scheduled: Joi.boolean().optional(),
  scheduledAt: Joi.date().when('scheduled', {
    is: true,
    then: Joi.date().greater('now').required().messages({
      'date.greater': 'Schedule date must be in the future',
      'any.required': 'Schedule date is required when scheduled is enabled'
    }),
    otherwise: Joi.optional()
  }),
  eventId: Joi.string().optional(),
  companyId: Joi.string().optional(),
  id: Joi.string().optional(),
});