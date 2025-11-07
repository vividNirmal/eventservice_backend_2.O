import Joi from 'joi';

// Basic Info Schema
const basicInfoSchema = Joi.object({
  full_name: Joi.string().trim().min(1).max(200).required(),
  form_number: Joi.number().integer().min(1).required(),
  due_date: Joi.date().optional().allow(null),
  submission_disclaimer: Joi.string().trim().max(1000).optional().allow(''),
  form_description: Joi.string().trim().max(2000).optional().allow(''),
  measurement_unit: Joi.string().trim().max(50).optional().allow(''),
  allow_multiple_submission: Joi.boolean().default(false),
  is_mendatory: Joi.boolean().default(false),
  dependant_form: Joi.string().trim().max(100).optional().allow(''),
  dependant_features: Joi.string().trim().max(200).optional().allow(''),
  limit_quantity_for_all: Joi.boolean().default(false),
  payment_collection_required: Joi.boolean().default(false),
  payment_collection_mode: Joi.string().valid('Online', 'Offline', 'Both').optional().allow(''),
  offline_payment_option: Joi.array().items(Joi.string()).default([]),
  tds_applicable: Joi.boolean().default(false),
  payment_instructions: Joi.string().trim().max(1000).optional().allow(''),
  service_provider: Joi.array().items(Joi.string()).default([]),
  stall_type: Joi.string().trim().max(100).optional().allow(''),
  apply_vendor_filter: Joi.boolean().default(false),
  apply_zone_filter: Joi.boolean().default(false),
  submit_without_pay_verify: Joi.boolean().default(false),
  machinery_wbs: Joi.string().trim().max(100).optional().allow(''),
  jewllery_wbs: Joi.string().trim().max(100).optional().allow(''),
  allow_personal_cctv_installation: Joi.boolean().default(false),
});

// Supporting Document Schema
const supportingDocumentSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  path: Joi.string().trim().min(1).max(500).required(),
});

// Media Info Schema
const mediaInfoSchema = Joi.object({
  important_instructions_image: Joi.string().trim().max(500).optional().allow(''),
  supporting_documents: Joi.array().items(supportingDocumentSchema).default([]),
});

// Other Info Schema
const otherInfoSchema = Joi.object({
  terms_and_condition: Joi.string().trim().min(1).required(),
  ofline_order_summary: Joi.string().trim().max(2000).optional().allow(''),
});

// Notification Template Schema
const notificationTemplateSchema = Joi.object({
  typeId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  templateId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  actionType: Joi.string().trim().required(),
  isCustom: Joi.boolean().default(false),
  templateRef: Joi.string().valid('Template', 'UserTemplate').optional(),
});

// Notification Detail Schema
const notificationDetailSchema = Joi.object({
  enabled: Joi.boolean().default(false),
  templates: Joi.array().items(notificationTemplateSchema).default([]),
});

// Notifications Schema
const notificationsSchema = Joi.object({
  emailNotification: notificationDetailSchema.default(),
  smsNotification: notificationDetailSchema.default(),
  whatsappNotification: notificationDetailSchema.default(),
});

// Main Create Schema
export const createExhibitorFormSchema = Joi.object({
  // Basic Info
  basicInfo: Joi.alternatives().try(
    basicInfoSchema,
    Joi.string() // JSON string from FormData
  ).required(),

  // Media Info
  mediaInfo: Joi.alternatives().try(
    mediaInfoSchema,
    Joi.string() // JSON string from FormData
  ).default({}),

  // Other Info
  otherInfo: Joi.alternatives().try(
    otherInfoSchema,
    Joi.string() // JSON string from FormData
  ).required(),

  // Notifications
  notifications: Joi.alternatives().try(
    notificationsSchema,
    Joi.string() // JSON string from FormData
  ).default({}),

  // System fields
  status: Joi.string().valid('active', 'inactive', 'expired').default('active'),
  companyId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  eventId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
}).unknown(true); // Allow unknown to accommodate files in FormData

// Update Body Schema
export const updateExhibitorFormBodySchema = Joi.object({
  // Basic Info
  basicInfo: Joi.alternatives().try(
    basicInfoSchema,
    Joi.string() // JSON string from FormData
  ).optional(),

  // Media Info
  mediaInfo: Joi.alternatives().try(
    mediaInfoSchema,
    Joi.string() // JSON string from FormData
  ).optional(),

  // Other Info
  otherInfo: Joi.alternatives().try(
    otherInfoSchema,
    Joi.string() // JSON string from FormData
  ).optional(),

  // Notifications
  notifications: Joi.alternatives().try(
    notificationsSchema,
    Joi.string() // JSON string from FormData
  ).optional(),

  // System fields
  status: Joi.string().valid('active', 'inactive', 'expired').optional(),
  companyId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  eventId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
}).unknown(true);

// Update Schema with params
export const updateExhibitorFormSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  }),
  body: updateExhibitorFormBodySchema,
});

// Delete Schema
export const deleteExhibitorFormSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  }),
});

// Get By ID Schema
export const getExhibitorFormByIdSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  }),
});

// Get All Query Schema
export const getExhibitorFormsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('active', 'inactive', 'expired').optional(),
  search: Joi.string().trim().max(100).optional(),
  stallType: Joi.string().trim().max(100).optional(),
  eventId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
});

// Bulk Delete Schema
export const bulkDeleteExhibitorFormsSchema = Joi.object({
  body: Joi.object({
    formIds: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).min(1).required(),
  }),
});