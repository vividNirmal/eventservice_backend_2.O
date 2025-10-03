import Joi from "joi";

// Create
export const createTemplateTypeSchema = Joi.object({
  type: Joi.string().valid("email", "sms", "whatsapp").required(),
  typeName: Joi.string().trim().min(1).max(100).required(),
});

// Update (params + body)
const updateTemplateTypeBodySchema = Joi.object({
  type: Joi.string().valid("email", "sms", "whatsapp").optional(),
  typeName: Joi.string().trim().min(1).max(100).optional(),
});

export const updateTemplateTypeSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  }),
  body: updateTemplateTypeBodySchema,
});