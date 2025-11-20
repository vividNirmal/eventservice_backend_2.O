import Joi from "joi";

const infoSchema = Joi.object({
  info_image: Joi.string().required().messages({
    "string.empty": "Info image is required",
  }),
  info_description: Joi.string().required().trim().min(1).max(1000).messages({
    "string.empty": "Info description is required",
    "string.min": "Info description must be at least 1 character",
    "string.max": "Info description must not exceed 1000 characters",
  }),
  _id: Joi.string().optional(),
});

export const saveReasonSectionSchema = Joi.object({
  title: Joi.string().required().trim().min(1).max(250).messages({
    "string.empty": "Title is required",
    "string.min": "Title must be at least 1 character",
    "string.max": "Title must not exceed 250 characters",
  }),
  description: Joi.string().optional().allow("").trim().max(1000).messages({
    "string.max": "Description must not exceed 1000 characters",
  }),
  image: Joi.string().optional().allow(""),
  existingImage: Joi.string().optional().allow(""),
  info: Joi.array().items(infoSchema).optional().default([]),
  existingInfo: Joi.string().optional(),
  infoImages: Joi.any().optional(),
  infoImageIndexes: Joi.any().optional(),
  companyId: Joi.string().required().messages({
    "string.empty": "Company ID is required",
  }),
});