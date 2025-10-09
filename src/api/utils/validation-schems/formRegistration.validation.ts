import Joi from "joi";

export const resolveFormUrlValidation = Joi.object({
  eventSlug: Joi.string().required().messages({
    "string.empty": "Event slug is required.",
  }),
    userTypeSlug: Joi.string().required().messages({
    "string.empty": "User type slug is required.",
  }),
});