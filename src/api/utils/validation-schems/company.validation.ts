import Joi from 'joi';

export const registerCompanySchema = Joi.object({
    company_name: Joi.string().required().messages({
        "string.company_name": "Please enter a valid Company Name.",
        "any.required": "Company Name is required."
    }),
    address: Joi.string().required().messages({
        "string.address": "Please enter a valid address.",
        "any.required": "Address is required."
    }),
    gst_number: Joi.string().required().messages({
        "string.gst_number": "Please enter a valid gst_number.",
        "any.required": "Gst Number is required."
    }),
    owner_name: Joi.string().required().messages({
        "string.owner_name": "Please enter a valid Owner Name.",
        "any.required": "Owner Name is required."
    }),
    email_one: Joi.string().required().messages({
        "string.email_one": "Please enter a valid Email.",
        "any.required": "Email is required."
    }),
    email_two: Joi.string()
    .email({ tlds: { allow: false } }) 
    .allow("")
    .messages({
        "string.email": "Please enter a valid Email.",
    }),
    subdomain: Joi.string().required().messages({
        "string.subdomain": "Please enter a valid Subdomain.",
        "any.required": "Subdomain is required."
    }),
     
});


export const deleteCompanySchema = Joi.object({
    company_ids: Joi.array().required().messages({
        "any.required": "company_ids is required."
    }),
});

export const updateStatusCompanySchema = Joi.object({
    company_id: Joi.string().required().messages({
        "any.required": "company_id is required."
    }),
    status: Joi.number().required().messages({
        "any.required": "company_id is required."
    }),
});



export const updateCompanySchema = Joi.object({
    company_name: Joi.string().required().messages({
        "string.company_name": "Please enter a valid Company Name.",
        "any.required": "Company Name is required."
    }),
    address: Joi.string().required().messages({
        "string.address": "Please enter a valid address.",
        "any.required": "Address is required."
    }),
    gst_number: Joi.string().required().messages({
        "string.gst_number": "Please enter a valid gst_number.",
        "any.required": "Gst Number is required."
    }),
    owner_name: Joi.string().required().messages({
        "string.owner_name": "Please enter a valid Owner Name.",
        "any.required": "Owner Name is required."
    }),
    email_one: Joi.string().required().messages({
        "string.email_one": "Please enter a valid Email.",
        "any.required": "Email is required."
    }),
    email_two: Joi.string()
    .email({ tlds: { allow: false } }) 
    .allow("")
    .messages({
        "string.email": "Please enter a valid Email.",
    }),
    subdomain: Joi.string().required().messages({
        "string.subdomain": "Please enter a valid Subdomain.",
        "any.required": "Subdomain is required."
    }),
    company_id: Joi.string().required().messages({
        "string.company_id": "Please enter a valid Subdomain.",
        "any.required": "Subdomain is required."
    }),
    attandess_dashboard_banner :Joi.optional(),
    exhibitor_dashboard_banner : Joi.optional()
     
});

export const updateCompanyLogoSchema = Joi.object({
    company_id: Joi.string().required().messages({
        "any.required": "company_id is required."
    }),
    logo:Joi.optional(),
    attandess_dashboard_banner :Joi.optional(),
    exhibitor_dashboard_banner : Joi.optional()
});


