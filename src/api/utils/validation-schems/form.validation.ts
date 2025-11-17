import Joi from "joi";

// Allow formFields as flexible JSON objects without strict validation
// This allows all the form builder properties like id, name, position, validation, etc.
const formFieldSchema = Joi.any();

export const createFormSchema = Joi.object({
    formName: Joi.string().required().min(3).max(100).messages({
        'string.empty': 'Form name is required',
        'string.min': 'Form name must be at least 3 characters long',
        'string.max': 'Form name must not exceed 100 characters',
        'any.required': 'Form name is required'
    }),
    isAdminForm: Joi.boolean().default(false),
    userType: Joi.string()
        .when("isAdminForm", {
            is: true,
            then: Joi.optional().allow(null),
            otherwise: Joi.string().required()
        }),
    formFields: Joi.array().items(formFieldSchema).optional().default([]),
    settings: Joi.any().optional(), // Allow settings object as flexible JSON
    companyId: Joi.string().optional().allow(null), // companyId can be null or empty for certain user types
    eventId: Joi.string().optional().allow(null) // eventId can be null or empty for certain user types
});

export const updateFormSchema = Joi.object({
    formId: Joi.string().required().messages({
        'string.empty': 'Form ID is required',
        'any.required': 'Form ID is required'
    }),
    formName: Joi.string().min(3).max(100).optional().messages({
        'string.min': 'Form name must be at least 3 characters long',
        'string.max': 'Form name must not exceed 100 characters'
    }),
    isAdminForm: Joi.boolean().optional(),
    userType: Joi.string()
        .when("isAdminForm", {
            is: true,
            then: Joi.optional().allow(null),
            otherwise: Joi.string().required()
        }),
    formFields: Joi.array().items(formFieldSchema).optional(),
    settings: Joi.any().optional() // Allow settings object as flexible JSON
});

export const updateFormBodySchema = Joi.object({
    formName: Joi.string().min(1).max(100).required().messages({
        'string.empty': 'Form name is required',
        'string.min': 'Form name cannot be empty',
        'string.max': 'Form name must not exceed 100 characters',
        'any.required': 'Form name is required'
    }),
    isAdminForm: Joi.boolean().optional(),
    userType: Joi.string()
        .when("isAdminForm", {
            is: true,
            then: Joi.optional().allow(null),
            otherwise: Joi.string().required()
        }),

    formFields: Joi.array().items(formFieldSchema).optional(),
    pages: Joi.any().optional(),
    settings: Joi.any().optional(), // Allow settings object as flexible JSON
    companyId: Joi.string().optional().allow(null) // companyId can be null or empty for certain user types
});

export const deleteFormSchema = Joi.object({
    formId: Joi.string().required().messages({
        'string.empty': 'Form ID is required',
        'any.required': 'Form ID is required'
    })
});

export const getFormByIdSchema = Joi.object({
    formId: Joi.string().required().messages({
        'string.empty': 'Form ID is required',
        'any.required': 'Form ID is required'
    })
});
