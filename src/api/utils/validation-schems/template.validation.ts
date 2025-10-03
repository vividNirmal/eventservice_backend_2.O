// validation/templateValidation.ts
import Joi from 'joi';

export const createTemplateSchema = Joi.object({
  body: Joi.object({
    // Common fields
    name: Joi.string().trim().min(1).max(100).required(),
    type: Joi.string().valid('email', 'sms', 'whatsapp').required(),
    typeId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),

    // Email specific fields
    subject: Joi.when('type', {
      is: 'email',
      then: Joi.string().trim().min(1).max(200).required(),
      otherwise: Joi.string().trim().max(200).optional().allow(null, '')
    }),
    content: Joi.when('type', {
      is: 'email',
      then: Joi.string().min(1).required(),
      otherwise: Joi.string().optional().allow(null, '')
    }),

    // SMS/WhatsApp validation
    text: Joi.when('type', {
      is: Joi.valid('sms', 'whatsapp'),
      then: Joi.string().trim().min(1).max(1000).required(),
      otherwise: Joi.string().trim().max(1000).optional()
    }),

    status: Joi.string().valid('active', 'inactive').default('active')
  })
});

export const updateTemplateBodySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  type: Joi.string().valid('email', 'sms', 'whatsapp').optional(),
  typeId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),

  // Email specific fields
  subject: Joi.alternatives().conditional('type', {
    is: 'email',
    then: Joi.string().trim().min(1).max(200).optional(),
    otherwise: Joi.string().trim().max(200).optional().allow(null, '')
  }),
  content: Joi.alternatives().conditional('type', {
    is: 'email',
    then: Joi.string().min(1).optional(),
    otherwise: Joi.string().optional().allow(null, '')
  }),

  // Conditional validation for text based on type
  text: Joi.alternatives().conditional('type', {
    is: Joi.valid('sms', 'whatsapp'),
    then: Joi.string().trim().min(1).max(1000).optional(),
    otherwise: Joi.string().trim().max(1000).optional()
  }),

  status: Joi.string().valid('active', 'inactive').optional()
});

export const updateTemplateSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
  }),
  body: updateTemplateBodySchema
});

export const deleteTemplateSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
  })
});
