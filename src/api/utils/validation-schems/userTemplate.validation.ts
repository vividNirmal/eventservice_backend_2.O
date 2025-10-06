import Joi from "joi";

export const createUserTemplateValidation = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Template name is required.",
    "any.required": "Template name is required.",
  }),
  formName: Joi.string().optional().allow(""),
  type: Joi.string().valid("email", "sms", "whatsapp").required().messages({
    "any.only": "Type must be one of: email, sms, whatsapp.",
    "any.required": "Template type is required.",
  }),
  typeId: Joi.string().required().messages({
    "string.empty": "Template type ID is required.",
    "any.required": "Template type ID is required.",
  }),
  text: Joi.when("type", {
    is: Joi.valid("sms", "whatsapp"),
    then: Joi.string().required().messages({
      "string.empty":
        "Text content is required for SMS and WhatsApp templates.",
      "any.required":
        "Text content is required for SMS and WhatsApp templates.",
    }),
    otherwise: Joi.string().optional().allow(""),
  }),
  subject: Joi.when("type", {
    is: "email",
    then: Joi.string().required().messages({
      "string.empty": "Subject is required for email templates.",
      "any.required": "Subject is required for email templates.",
    }),
    otherwise: Joi.string().optional().allow(""),
  }),
  content: Joi.when("type", {
    is: "email",
    then: Joi.string().required().messages({
      "string.empty": "HTML content is required for email templates.",
      "any.required": "HTML content is required for email templates.",
    }),
    otherwise: Joi.string().optional().allow(""),
  }),
  attachments: Joi.array().optional(),
  existingAttachments: Joi.any().optional(),
  defaultOption: Joi.alternatives()
    .try(
      Joi.object({
        used: Joi.boolean().default(false),
        cc: Joi.array().items(Joi.string().email()).optional(),
        bcc: Joi.array().items(Joi.string().email()).optional(),
      }),
      Joi.string().custom((value, helpers) => {
        try {
          return JSON.parse(value);
        } catch (err) {
          return helpers.error("any.invalid");
        }
      })
    )
    .optional(),
  status: Joi.string().valid("active", "inactive").default("active"),
  userId: Joi.string().optional().allow(""),
  companyId: Joi.string().optional().allow(""),
  eventId: Joi.string().optional().allow(""),
});

export const updateUserTemplateValidation = Joi.object({
  id: Joi.string().optional(),
  name: Joi.string().optional(),
  formName: Joi.string().optional().allow(""),
  type: Joi.string().valid("email", "sms", "whatsapp").optional(),
  typeId: Joi.string().optional(),
  text: Joi.string().optional().allow(""),
  subject: Joi.string().optional().allow(""),
  content: Joi.string().optional().allow(""),
  attachments: Joi.array().optional(),
  existingAttachments: Joi.any().optional(),
  defaultOption: Joi.alternatives()
    .try(
      Joi.object({
        used: Joi.boolean().default(false),
        cc: Joi.array().items(Joi.string().email()).optional(),
        bcc: Joi.array().items(Joi.string().email()).optional(),
      }),
      Joi.string().custom((value, helpers) => {
        try {
          return JSON.parse(value);
        } catch (err) {
          return helpers.error("any.invalid");
        }
      })
    )
    .optional(),
  status: Joi.string().valid("active", "inactive").optional(),
  userId: Joi.string().optional().allow(""),
  companyId: Joi.string().optional().allow(""),
  eventId: Joi.string().optional().allow(""),
});
