import Joi from "joi";

export const createEventZoneSchema = Joi.object({
  name: Joi.string().required().max(100),
  eventId: Joi.string().required(),
  companyId: Joi.string().optional().allow(null, ""),
});

export const updateEventZoneSchema = Joi.object({
  name: Joi.string().max(100),
  eventId: Joi.string().optional(),
  companyId: Joi.string().optional(),
  id: Joi.string().optional(),
});
