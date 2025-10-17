import Joi from "joi";

// Legacy static form validation - now made flexible for backward compatibility
export const EventParticipantUsers = Joi.object({
  // Core system fields
  event_id: Joi.string().required().messages({
    "any.required": "Event ID is required.",
  }),
  user_token: Joi.string().optional(),

  // Email validation - accept multiple formats
  email: Joi.string().email().optional(),
  email_address: Joi.string().email().optional(),

  // Optional fields for backward compatibility
  first_name: Joi.string().optional(),
  last_name: Joi.string().optional(),
  designation: Joi.string().optional(),
  organization: Joi.string().optional(),
  contact: Joi.string().optional(),
  country: Joi.string().optional(),
  state: Joi.string().optional(),
  city: Joi.string().optional(),
  address: Joi.string().optional(),
  visit_reason: Joi.string().optional(),
  referral_source: Joi.string().optional(),
  company_activity: Joi.string().optional(),
})
  .unknown(true) // Allow additional fields
  .custom((value, helpers) => {
    // Ensure at least one email field is provided
    if (!value.email && !value.email_address) {
      return helpers.error("custom.missingEmail");
    }
    return value;
  })
  .messages({
    "custom.missingEmail": "Either email or email_address is required.",
  });

// Flexible validation for dynamic forms - only require essential system fields
export const DynamicEventParticipantUsers = Joi.object({
  // Core system fields required for processing
  event_id: Joi.string().required().messages({
    "any.required": "Event ID is required.",
  }),
  user_token: Joi.string().optional(),
  form_type: Joi.string().optional(),

  // File upload fields
  face_image: Joi.any().optional(),
  image_url: Joi.string().optional(),
  face_id: Joi.string().optional(),
})
  .unknown(true) // Allow any additional fields for completely dynamic form data
  .custom((value, helpers) => {
    // Ensure at least one email field is provided for user identification
    if (!value.email && !value.email_address) {
      return helpers.error("custom.missingEmail");
    }
    return value;
  })
  .messages({
    "custom.missingEmail":
      "Either email or email_address is required for user identification.",
  });

export const sendOtpValidation = Joi.object({
  email: Joi.string().allow("", null).optional().messages({
    "string.base": '"email" should be a string.',
    "string.empty": '"email" cannot be an empty field.',
  }),
  contact: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .allow("", null)
    .optional()
    .messages({
      "string.pattern.base": "Phone number must be a 10-digit number",
    }),
});

export const verifyOtpValidation = Joi.object({
  contact: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be a 10-digit number",
      "string.req": '"contact" cannot be an empty field.',
    }),

  event_slug: Joi.string().required().messages({
    "any.required": "Slug is required.",
    "string.empty": '"slug" cannot be an empty field.',
  }),
  scanner_type: Joi.string().required().messages({
    "any.required": "Scanner Type is required.",
    "string.empty": '"Scanner Type" cannot be an empty field.',
  }),
});

export const UpdateParticipantUsers = Joi.object({
  email: Joi.string().required().messages({
    "any.required": "Email is required.",
    "string.base": "Email must be a string.",
  }),
  first_name: Joi.string().required().messages({
    "any.required": "First Name is required.",
    "string.base": "First Name must be a string.",
  }),
  last_name: Joi.string().required().messages({
    "any.required": "Last Name is required.",
    "string.base": "Last Name must be a string.",
  }),
  designation: Joi.string().required().messages({
    "any.required": "Designation is required.",
    "string.base": "Designation must be a string.",
  }),
  organization: Joi.string().required().messages({
    "any.required": "Organization is required.",
    "string.base": "Organization must be a string.",
  }),
  contact: Joi.string().required().messages({
    "any.required": "Contact is required.",
    "string.base": "Contact is required.",
  }),
  country: Joi.string().required().messages({
    "any.required": "Country is required.",
    "string.base": "Country must be a string.",
  }),
  state: Joi.string().required().messages({
    "any.required": "State is required.",
    "string.base": "State must be a string.",
  }),
  city: Joi.string().required().messages({
    "any.required": "City is required.",
    "string.base": "City must be a string.",
  }),
  address: Joi.string().required().messages({
    "any.required": "Address is required.",
    "string.base": "Address is required.",
  }),
  participant_user_id: Joi.string().required().messages({
    "any.required": "Participant User ID is required.",
  }),
});
