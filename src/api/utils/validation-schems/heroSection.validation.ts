import Joi from "joi";

export const createHeroSectionSchema = Joi.object({
  title: Joi.string().required().min(1).max(255).messages({
    "string.empty": "Title is required",
    "string.min": "Title must be at least 1 character",
    "string.max": "Title must not exceed 255 characters",
  }),
  description: Joi.string().required().min(1).max(1000).messages({
    "string.empty": "Description is required",
    "string.min": "Description must be at least 1 character",
    "string.max": "Description must not exceed 1000 characters",
  }),
  image: Joi.string().uri().optional().allow(null, ''),
  companyId: Joi.string().required().messages({
    "string.empty": "Company ID is required",
  }),
});

export const updateHeroSectionSchema = Joi.object({
  title: Joi.string().min(1).max(255).messages({
    "string.min": "Title must be at least 1 character",
    "string.max": "Title must not exceed 255 characters",
  }),
  description: Joi.string().min(1).max(1000).messages({
    "string.min": "Description must be at least 1 character",
    "string.max": "Description must not exceed 1000 characters",
  }),
  image: Joi.string().uri().optional().allow(null, ''),
  companyId: Joi.string().optional(),
  id: Joi.string().optional(),
});