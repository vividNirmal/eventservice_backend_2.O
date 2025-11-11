// validations/exhibitorFormParticular.validation.ts
import Joi from 'joi';

// Document Schema
const documentSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  path: Joi.string().trim().min(1).max(500).required(),
});

// Main Create Schema
export const createExhibitorFormParticularSchema = Joi.object({
  // Basic fields
  item_name: Joi.string().trim().min(1).max(200).required(),
  disclaimer: Joi.string().trim().max(500).optional().allow(''),
  purachase_limit_per_order: Joi.number().integer().min(0).default(0),
  national_price: Joi.number().min(0).precision(2).default(0),
  international_price: Joi.number().min(0).precision(2).default(0),
  material_number: Joi.number().integer().min(0).default(0),
  zones: Joi.array().items(Joi.string().trim()).default([]),
  venue: Joi.array().items(Joi.string().trim()).default([]),
  image: Joi.string().trim().max(500).optional().allow(''),
  documents: Joi.array().items(documentSchema).default([]),
  status: Joi.string().valid('active', 'inactive').default('active'),

  // System fields
  companyId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  eventId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  exhibitorFormId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
}).unknown(true); // Allow unknown to accommodate files in FormData

// Update Body Schema
export const updateExhibitorFormParticularSchema = Joi.object({
  // Basic fields
  item_name: Joi.string().trim().min(1).max(200).optional(),
  disclaimer: Joi.string().trim().max(500).optional().allow(''),
  purachase_limit_per_order: Joi.number().integer().min(0).optional(),
  national_price: Joi.number().min(0).precision(2).optional(),
  international_price: Joi.number().min(0).precision(2).optional(),
  material_number: Joi.number().integer().min(0).optional(),
  zones: Joi.array().items(Joi.string().trim()).optional(),
  venue: Joi.array().items(Joi.string().trim()).optional(),
  image: Joi.string().trim().max(500).optional().allow(''),
  documents: Joi.array().items(documentSchema).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),

  // System fields
  companyId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  eventId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  exhibitorFormId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
}).unknown(true);


// Delete Schema
export const deleteExhibitorFormParticularSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  }),
});

// Get By ID Schema
export const getExhibitorFormParticularByIdSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  }),
});

// Get All Query Schema
export const getExhibitorFormParticularsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('active', 'inactive').optional(),
  search: Joi.string().trim().max(100).optional(),
  exhibitorFormId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  eventId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  companyId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
});

// Status Update Schema
export const updateExhibitorFormParticularStatusSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  }),
  body: Joi.object({
    status: Joi.string().valid('active', 'inactive').required(),
  }),
});