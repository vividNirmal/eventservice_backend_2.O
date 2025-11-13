// validations/exhibitorFormParticular.validation.ts
import Joi from 'joi';

// Document Schema
const documentSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  path: Joi.string().trim().min(1).max(500).required(),
});

// Zone ID validation (MongoDB ObjectId or string)
const zoneIdSchema = Joi.alternatives().try(
  Joi.string().pattern(/^[0-9a-fA-F]{24}$/), // MongoDB ObjectId
  Joi.string().trim().min(1).max(100) // Zone name as fallback
);

// Main Create Schema
export const createExhibitorFormParticularSchema = Joi.object({
  // Basic fields
  item_name: Joi.string().trim().min(1).max(200).required()
    .messages({
      'string.empty': 'Item name is required',
      'string.max': 'Item name must not exceed 200 characters',
    }),
  disclaimer: Joi.string().trim().max(500).optional().allow('')
    .messages({
      'string.max': 'Disclaimer must not exceed 500 characters',
    }),
  purachase_limit_per_order: Joi.number().integer().min(0).default(0)
    .messages({
      'number.min': 'Purchase limit cannot be negative',
      'number.integer': 'Purchase limit must be a whole number',
    }),
  national_price: Joi.number().min(0).precision(2).default(0)
    .messages({
      'number.min': 'National price cannot be negative',
      'number.precision': 'National price must have at most 2 decimal places',
    }),
  international_price: Joi.number().min(0).precision(2).default(0)
    .messages({
      'number.min': 'International price cannot be negative',
      'number.precision': 'International price must have at most 2 decimal places',
    }),
  material_number: Joi.number().integer().min(0).default(0)
    .messages({
      'number.min': 'Material number cannot be negative',
      'number.integer': 'Material number must be a whole number',
    }),
  
  // Zones can be array of zone IDs or JSON string (for FormData)
  zones: Joi.alternatives().try(
    Joi.array().items(zoneIdSchema),
    Joi.string().trim() // For JSON string from FormData
  ).default([]),
  
  venue: Joi.array().items(Joi.string().trim()).default([]),
  image: Joi.string().trim().max(500).optional().allow(''),
  documents: Joi.array().items(documentSchema).default([]),
  status: Joi.string().valid('active', 'inactive').default('active'),

  // File fields (for FormData)
  imageFile: Joi.any().optional(), // For actual file upload
  documents_files: Joi.any().optional(), // For document file uploads
  documents_metadata: Joi.string().optional(), // For document metadata JSON

  // System fields
  companyId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
    .messages({
      'string.pattern.base': 'Company ID must be a valid MongoDB ObjectId',
    }),
  eventId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    .messages({
      'string.pattern.base': 'Event ID must be a valid MongoDB ObjectId',
      'any.required': 'Event ID is required',
    }),
  exhibitorFormId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    .messages({
      'string.pattern.base': 'Exhibitor Form ID must be a valid MongoDB ObjectId',
      'any.required': 'Exhibitor Form ID is required',
    }),
}).unknown(true); // Allow unknown to accommodate files in FormData

// Update Body Schema
export const updateExhibitorFormParticularSchema = Joi.object({
  // Basic fields
  item_name: Joi.string().trim().min(1).max(200).optional()
    .messages({
      'string.empty': 'Item name cannot be empty',
      'string.max': 'Item name must not exceed 200 characters',
    }),
  disclaimer: Joi.string().trim().max(500).optional().allow('')
    .messages({
      'string.max': 'Disclaimer must not exceed 500 characters',
    }),
  purachase_limit_per_order: Joi.number().integer().min(0).optional()
    .messages({
      'number.min': 'Purchase limit cannot be negative',
      'number.integer': 'Purchase limit must be a whole number',
    }),
  national_price: Joi.number().min(0).precision(2).optional()
    .messages({
      'number.min': 'National price cannot be negative',
      'number.precision': 'National price must have at most 2 decimal places',
    }),
  international_price: Joi.number().min(0).precision(2).optional()
    .messages({
      'number.min': 'International price cannot be negative',
      'number.precision': 'International price must have at most 2 decimal places',
    }),
  material_number: Joi.number().integer().min(0).optional()
    .messages({
      'number.min': 'Material number cannot be negative',
      'number.integer': 'Material number must be a whole number',
    }),
  
  // Zones can be array of zone IDs or JSON string (for FormData)
  zones: Joi.alternatives().try(
    Joi.array().items(zoneIdSchema),
    Joi.string().trim() // For JSON string from FormData
  ).optional(),
  
  venue: Joi.array().items(Joi.string().trim()).optional(),
  image: Joi.string().trim().max(500).optional().allow(''),
  documents: Joi.array().items(documentSchema).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),

  // File fields (for FormData)
  imageFile: Joi.any().optional(), // For actual file upload
  documents_files: Joi.any().optional(), // For document file uploads
  documents_metadata: Joi.string().optional(), // For document metadata JSON

  // System fields
  companyId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
    .messages({
      'string.pattern.base': 'Company ID must be a valid MongoDB ObjectId',
    }),
  eventId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
    .messages({
      'string.pattern.base': 'Event ID must be a valid MongoDB ObjectId',
    }),
  exhibitorFormId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
    .messages({
      'string.pattern.base': 'Exhibitor Form ID must be a valid MongoDB ObjectId',
    }),
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
    .messages({
      'string.pattern.base': 'ID must be a valid MongoDB ObjectId',
    }),
}).unknown(true);



// Status Update Schema
export const updateExhibitorFormParticularStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive').required()
    .messages({
      'any.only': 'Status must be either active or inactive',
      'any.required': 'Status is required',
  }),
  id: Joi.string().optional(),
});