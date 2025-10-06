import Joi from "joi";

export const createDefaultFieldSchema = Joi.object({
  fieldName: Joi.string().required().min(1).max(100).messages({
    "string.empty": "Field name is required",   
  }),
  fieldTitle :Joi.string().required().messages({
    "string.empty": "Field Title is required",   
  }),

  fieldType: Joi.string()
    .valid("text", "number", "date", "boolean", "dropdown", "radio", "checkbox",'textarea','email','url',"file")
    .required()
    .messages({
      "string.empty": "Field type is required",
      "any.required": "Field type is required",
      "any.only":
        "Field type must be one of: text, number, date, boolean, dropdown, radio, checkbox",
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

  fieldOptions: Joi.array().items(Joi.string().min(1).max(100)).messages({
    "array.base": "Field options must be an array of strings",
  }),

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
  id :Joi.optional(),
  fieldDescription: Joi.optional(),
  fieldminLimit : Joi.optional(),
  fieldmaxLimit :  Joi.optional(),
  specialCharactor : Joi.optional(),
  userFieldMapping : Joi.optional(),
  fieldPermission : Joi.optional()
});


