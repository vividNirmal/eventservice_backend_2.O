import Joi from "joi";

export const createAboutSectionSchema = Joi.object({
  title: Joi.string().required().messages({
    "string.empty": "Title is required",
  }),
  description: Joi.string().required().messages({
    "string.empty": "Description is required",
  }),
  companyId: Joi.string().required().messages({
    "string.empty": "Company ID is required",
  }),
});
