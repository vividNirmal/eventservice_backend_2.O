import Joi from "joi";

export const submitExhibitorApplicationValidation = Joi.object({
  exhibitorFormId: Joi.string().required().messages({
    "string.empty": "Ticket ID is required.",
    "any.required": "Ticket ID is required.",
  }),
  // Since form fields are dynamic, we allow extra keys
}).unknown(true);


export const updateExhibitorApplicationStatusValidation = Joi.object({
  approved: Joi.boolean().required(),
  id: Joi.string().optional(),
});