import Joi from "joi";

export const createUserTypeMapSchema = Joi.object({
  shortName: Joi.string().required().min(1).max(20),
  userType: Joi.string().required(),
  companyId: Joi.string().required(),
  eventId: Joi.string().optional().allow(null, "")
});

export const updateUserTypeMapSchema = Joi.object({
  shortName: Joi.string().min(1).max(20),
  userType: Joi.string(),
  companyId: Joi.string().required(),
  eventId: Joi.string().optional().allow(null, ""),
  id: Joi.string().optional()
});
