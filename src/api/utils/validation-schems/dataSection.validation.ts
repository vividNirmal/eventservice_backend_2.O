import Joi from "joi";

const badgeSchema = Joi.object({
  image: Joi.string().required().messages({
    "string.empty": "Badge image is required",
  }),
  value: Joi.string().required().trim().min(1).max(150).messages({
    "string.empty": "Badge value is required",
    "string.min": "Badge value must be at least 1 character",
    "string.max": "Badge value must not exceed 150 characters",
  }),
  label: Joi.string().required().trim().min(1).max(150).messages({
    "string.empty": "Badge label is required",
    "string.min": "Badge label must be at least 1 character",
    "string.max": "Badge label must not exceed 150 characters",
  }),
  _id: Joi.string().optional(),
});

export const saveDataSectionSchema = Joi.object({
  title: Joi.string().required().trim().min(1).max(250).messages({
    "string.empty": "Title is required",
    "string.min": "Title must be at least 1 character",
    "string.max": "Title must not exceed 250 characters",
  }),
  badges: Joi.array().items(badgeSchema).optional().default([]),
  existingBadges: Joi.string().optional(),
  badgeImages: Joi.any().optional(),
  badgeImageIndexes: Joi.any().optional(),
  companyId: Joi.string().required().messages({
    "string.empty": "Company ID is required",
  }),
});