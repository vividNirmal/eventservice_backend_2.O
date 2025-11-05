import Joi from "joi";

export const createEventImageSchema = Joi.object({
  name: Joi.string().required().min(1).max(150).messages({
    "string.empty": "Image name is required",
    "string.min": "Image name must be at least 1 character",
    "string.max": "Image name must not exceed 150 characters",
  }),
  image: Joi.string().uri().optional().allow(null,''),
  eventId: Joi.string().required().messages({
    "string.empty": "Event ID is required",
  }),
  companyId: Joi.string().optional(),
});

export const updateEventImageSchema = Joi.object({
  name: Joi.string().min(1).max(150).messages({
    "string.min": "Image name must be at least 1 character",
    "string.max": "Image name must not exceed 150 characters",
  }),
  image: Joi.string().uri().optional().allow(null,''),
  eventId: Joi.string().optional(),
  companyId: Joi.string().optional(),
  id: Joi.string().optional(),
});
