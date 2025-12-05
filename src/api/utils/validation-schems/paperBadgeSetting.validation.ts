import Joi from "joi";

const allowedPaperSizes = ["a4", "a5", "a6", "letter", "legal"];

export const createPaperBadgeSettingSchema = Joi.object({
  name: Joi.string().required().min(1).max(100).messages({
    "string.empty": "Setting name is required",
    "string.min": "Setting name must be at least 1 character",
    "string.max": "Setting name must not exceed 100 characters",
  }),
  templateId: Joi.string().optional().allow(null, ""),
  ticketIds: Joi.array().items(Joi.string()).optional(),
  paperSize: Joi.string()
    .valid(...allowedPaperSizes)
    .default("a4")
    .messages({
      "any.only": "Paper size must be one of 'a4', 'a5', 'a6', 'letter', 'legal'",
    }),
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
  templateId: Joi.string().optional().allow(null, ""),
  ticketIds: Joi.array().items(Joi.string()).optional(),
  paperSize: Joi.string()
    .valid(...allowedPaperSizes)
    .optional()
    .messages({
      "any.only": "Paper size must be one of 'a4', 'a5', 'a6', 'letter', 'legal'",
    }),
  eventId: Joi.string().optional(),
  companyId: Joi.string().optional(),
  id: Joi.string().optional(),
});

export const updatePaperBadgeSettingPropertiesSchema = Joi.object({
  id: Joi.string().optional(),
  templateId: Joi.string().optional().allow(null, ""),
  fixedPosition: Joi.boolean().optional(),
  paperSize: Joi.string()
    .valid(...allowedPaperSizes)
    .optional()
    .messages({
      "any.only": "Paper size must be one of 'a4', 'a5', 'a6', 'letter', 'legal'",
    }),
  fields: Joi.array().optional(),
  fieldProperties: Joi.object().optional(),
});