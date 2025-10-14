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
  email: Joi.string().required().messages({
    "string.empty": "Email is required.",
  }),
  ticketId: Joi.string().required().messages({
    "string.empty": "Ticket ID is required.",
  }),
});

export const submitRegistrationValidation = Joi.object({
  ticketId: Joi.string().required().messages({
    "string.empty": "Ticket ID is required.",
    "any.required": "Ticket ID is required.",
  }),

  email: Joi.string().email().required().messages({
    "string.email": "A valid email address is required.",
    "string.empty": "Email is required.",
    "any.required": "Email is required.",
  }),

  eventId: Joi.string().optional().allow(null, "").messages({
    "string.base": "Event ID must be a valid string.",
  }),
  // Since form fields are dynamic, we allow extra keys
}).unknown(true);

export const generatePdfValidation = Joi.object({
  formRegistrationId: Joi.string().required().messages({
    "string.empty": "ID is required.",
  }),
});