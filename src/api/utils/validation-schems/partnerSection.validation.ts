import Joi from "joi";

const partnerSchema = Joi.object({
  image: Joi.string().required().messages({
    "string.empty": "Partner image is required",
  }),
  name: Joi.string().required().trim().min(1).max(150).messages({
    "string.empty": "Partner name is required",
    "string.min": "Partner name must be at least 1 character",
    "string.max": "Partner name must not exceed 150 characters",
  }),
  _id: Joi.string().optional(),
});

export const savePartnerSectionSchema = Joi.object({
  title: Joi.string().required().trim().min(1).max(250).messages({
    "string.empty": "Title is required",
    "string.min": "Title must be at least 1 character",
    "string.max": "Title must not exceed 250 characters",
  }),
  partners: Joi.array().items(partnerSchema).optional().default([]),
  existingPartners: Joi.string().optional(),
  partnerImages: Joi.any().optional(),
  partnerImageIndexes: Joi.any().optional(),
  companyId: Joi.string().required().messages({
    "string.empty": "Company ID is required",
  }),
});