import Joi from "joi";

export const createDefaultFieldSchema = Joi.object({
  fieldName: Joi.string().required().min(1).max(100).messages({
    "string.empty": "Field name is required",
  }),
  fieldTitle: Joi.string().required().messages({
    "string.empty": "Field Title is required",
  }),

  fieldType: Joi.string().required().messages({
    "string.empty": "Field type is required",
    "any.required": "Field type is required",
  }),

  isRequired: Joi.boolean().default(false),

  requiredErrorText: Joi.string().allow("").max(200).messages({
    "string.max": "Error text must not exceed 200 characters",
  }),

  placeHolder: Joi.string().allow("").max(200),

  inputType: Joi.string()
    .valid("text", "email", "password", "number", "date", "checkbox", "radio")
    .allow(null, ""),

  isPrimary: Joi.boolean().default(false),

  fieldOptions: Joi.array(),

  validators: Joi.array()
    .items(
      Joi.object({
        type: Joi.string().required().messages({
          "any.required": "Validator type is required",
        }),
        text: Joi.string().allow(""),
        regex: Joi.string().allow(""),
      })
    )
    .default([]),

  icon: Joi.string().allow(null, ""),

  userType: Joi.array().optional().messages({
    "any.required": "User type is required",
  }),
  id: Joi.optional(),
  fieldDescription: Joi.optional(),
  fieldminLimit: Joi.optional(),
  fieldmaxLimit: Joi.optional(),
  specialCharactor: Joi.optional(),
  userFieldMapping: Joi.optional(),
  fieldPermission: Joi.optional(),  
  optionUrl: Joi.string().optional().allow("", null),
  optionPath: Joi.string().optional().allow("", null),
  optionValue: Joi.string().optional().allow("", null),
  optionName: Joi.string().optional().allow("", null),
  optionRequestType: Joi.string().optional().allow("", null),
  optionDepending :  Joi.string().optional().allow("", null),
  filevalidation : Joi.optional(),
  fieldConfigration : Joi.optional()
});

export const deleteDefaultFieldSchema = Joi.object({
    filed_ids: Joi.array().required().messages({
        "any.required": "users_ids is required."
    }),
});