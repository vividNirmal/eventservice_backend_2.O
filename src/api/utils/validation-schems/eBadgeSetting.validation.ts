import Joi from "joi";

export const createEBadgeSettingSchema = Joi.object({
  name: Joi.string().required().min(1).max(100).messages({
    "string.empty": "Setting name is required",
    "string.min": "Setting name must be at least 1 character",
    "string.max": "Setting name must not exceed 100 characters",
  }),
  templateId: Joi.string().optional().allow(''),
  ticketIds: Joi.array().items(Joi.string()).optional(),
  downloadOption: Joi.string()
    .valid('print', 'print_and_download', 'download', 'none')
    .required()
    .messages({
      "any.only": "Download option must be one of: print, print_and_download, download, none",
      "any.required": "Download option is required",
    }),
  eventId: Joi.string().required().messages({
    "string.empty": "Event ID is required",
  }),
  companyId: Joi.string().optional(),
});

export const updateEBadgeSettingSchema = Joi.object({
  name: Joi.string().min(1).max(100).messages({
    "string.min": "Setting name must be at least 1 character",
    "string.max": "Setting name must not exceed 100 characters",
  }),
  templateId: Joi.string().optional().allow(''),
  ticketIds: Joi.array().items(Joi.string()).optional(),
  downloadOption: Joi.string()
    .valid('print', 'print_and_download', 'download', 'none')
    .messages({
      "any.only": "Download option must be one of: print, print_and_download, download, none",
    }),
  eventId: Joi.string().optional(),
  companyId: Joi.string().optional(),
  id: Joi.string().optional(),
});

export const updateEBadgeSettingPropertiesSchema = Joi.object({
  id: Joi.string().optional(),
  templateId: Joi.string().optional().allow(''),
  fixedPosition: Joi.boolean().optional(),
  fields: Joi.array().optional(),
  fieldProperties: Joi.object().optional(),
});