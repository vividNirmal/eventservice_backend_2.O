import Joi from "joi";

const heroSchema = Joi.object({
  image: Joi.string().required().messages({
    "string.empty": "Hero image is required",
  }),
  title: Joi.string().required().trim().min(1).max(255).messages({
    "string.empty": "Hero title is required",
    "string.min": "Hero title must be at least 1 character",
    "string.max": "Hero title must not exceed 255 characters",
  }),
  description: Joi.string().required().trim().min(1).max(1000).messages({
    "string.empty": "Hero description is required",
    "string.min": "Hero description must be at least 1 character",
    "string.max": "Hero description must not exceed 1000 characters",
  }),
  _id: Joi.string().optional(),
});

export const saveHeroSectionSchema = Joi.object({
  hero: Joi.array().items(heroSchema).optional().default([]),
  existingHeroes: Joi.string().optional(),
  heroImages: Joi.any().optional(),
  heroImageIndexes: Joi.any().optional(),
  companyId: Joi.string().required().messages({
    "string.empty": "Company ID is required",
  }),
});