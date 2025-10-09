import Joi from "joi";

export const resolveFormUrlValidation = Joi.object({
  eventSlug: Joi.string().required().messages({
    "string.empty": "Event slug is required.",
  }),
  userTypeSlug: Joi.string().required().messages({
    "string.empty": "User type slug is required.",
  }),
});

export const resolveEmailValidation = Joi.object({
  regEmail: Joi.string().required().messages({
    "string.empty": "Email is required.",
  }),
  ticketId: Joi.string().required().messages({
    "string.empty": "Ticket ID is required.",
  }),
});
