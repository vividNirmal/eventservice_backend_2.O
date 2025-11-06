import Joi from "joi";

export const createEventCompanyTeamSchema = Joi.object({
  first_name: Joi.string().required().min(1).max(100).messages({
    "string.empty": "First name is required",
    "string.min": "First name must be at least 1 character",
    "string.max": "First name must not exceed 100 characters",
  }),
  last_name: Joi.string().required().min(1).max(100).messages({
    "string.empty": "Last name is required",
    "string.min": "Last name must be at least 1 character",
    "string.max": "Last name must not exceed 100 characters",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  }),
  contact_no: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.empty": "Contact number is required",
      "string.pattern.base": "Contact number must be 10 digits",
    }),
  pan_no: Joi.string()
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base": "Invalid PAN number format",
    }),
  pan_card: Joi.string().optional().allow("", null),
  profile_picture: Joi.string().optional().allow("", null),
  ownership: Joi.string()
    .valid("owner", "employee")
    .required()
    .messages({
      "string.empty": "Ownership/Role is required",
      "any.only": "Ownership must be owner, partner, or employee",
    }),
  birth_date: Joi.string().required().messages({
    "string.empty": "Birth date is required",
  }),
  gender: Joi.string()
    .valid("male", "female", "other")
    .required()
    .messages({
      "string.empty": "Gender is required",
      "any.only": "Gender must be male, female, or other",
    }),
  address_line1: Joi.string().required().min(1).max(255).messages({
    "string.empty": "Address line 1 is required",
    "string.max": "Address line 1 must not exceed 255 characters",
  }),
  address_line2: Joi.string().optional().allow("").max(255).messages({
    "string.max": "Address line 2 must not exceed 255 characters",
  }),
  pincode: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({
      "string.empty": "Pincode is required",
      "string.pattern.base": "Pincode must be 6 digits",
    }),
  country: Joi.string().required().messages({
    "string.empty": "Country is required",
  }),
  state: Joi.string().required().messages({
    "string.empty": "State is required",
  }),
  city: Joi.string().required().messages({
    "string.empty": "City is required",
  }),
  eventUser: Joi.string().required().messages({
    "string.empty": "Event User ID is required",
  }),
});

export const updateEventCompanyTeamSchema = Joi.object({
  first_name: Joi.string().min(1).max(100).messages({
    "string.min": "First name must be at least 1 character",
    "string.max": "First name must not exceed 100 characters",
  }),
  last_name: Joi.string().min(1).max(100).messages({
    "string.min": "Last name must be at least 1 character",
    "string.max": "Last name must not exceed 100 characters",
  }),
  email: Joi.string().email().messages({
    "string.email": "Please provide a valid email address",
  }),
  contact_no: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .messages({
      "string.pattern.base": "Contact number must be 10 digits",
    }),
  pan_no: Joi.string()
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base": "Invalid PAN number format",
    }),
  pan_card: Joi.string().optional().allow("", null),
  profile_picture: Joi.string().optional().allow("", null),
  ownership: Joi.string()
    .valid("owner", "employee")
    .messages({
      "any.only": "Ownership must be owner, partner, or employee",
    }),
  birth_date: Joi.string(),
  gender: Joi.string()
    .valid("male", "female", "other")
    .messages({
      "any.only": "Gender must be male, female, or other",
    }),
  address_line1: Joi.string().min(1).max(255).messages({
    "string.max": "Address line 1 must not exceed 255 characters",
  }),
  address_line2: Joi.string().optional().allow("").max(255).messages({
    "string.max": "Address line 2 must not exceed 255 characters",
  }),
  pincode: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .messages({
      "string.pattern.base": "Pincode must be 6 digits",
    }),
  country: Joi.string(),
  state: Joi.string(),
  city: Joi.string(),
  eventUser: Joi.string(),
  id: Joi.string().optional(),
});

export const getEventCompanyTeamQuerySchema = Joi.object({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
  search: Joi.string().optional().allow(""),
  ownership: Joi.string()
    .valid("all", "owner", "partner", "employee")
    .optional(),
  eventUser: Joi.string().required().messages({
    "string.empty": "Event User ID is required",
  }),
});