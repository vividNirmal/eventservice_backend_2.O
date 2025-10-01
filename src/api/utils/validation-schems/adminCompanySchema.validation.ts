import Joi from 'joi';

export const adminCompanySchema = Joi.object({
    like_to_visit: Joi.string().required().messages({
        "any.required": "Like to visit is required.",
        "string.base": "Company Name must be a string."
    }),
    company_type: Joi.string().required().messages({
        "any.required": "Company Type required.",
        "string.base": "Company Type must be a string."
    }),
    address_type: Joi.string().required().messages({
        "any.required": "Address Type required.",
        "string.base": "Address Type must be a string."
    }),
    company_name: Joi.string().required().messages({
        "any.required": "Company Name required.",
        "string.base": "Company Name must be a string."
    }),
    company_email: Joi.string().required().messages({
        "any.required": "Company Email required.",
        "string.base": "Company Email must be a string."
    }),
    country_number: Joi.string().required().messages({
        "any.required": "Country Number required.",
        "string.base": "Country Number must be a string."
    }),
    country_code: Joi.string().required().messages({
        "any.required": "Country Code required.",
        "string.base": "Country Code must be a string."
    }),
    business_nature: Joi.string().messages({
        "any.required": "Business Nature Number required.",
        "string.base": "Country Number must be a string."
    }),
    objective_of_visiting: Joi.string().messages({
        "any.required": "Business Nature Number required.",
        "string.base": "Country Number must be a string."
    }),
    first_learn_about: Joi.string().messages({
        "any.required": "Business Nature Number required.",
        "string.base": "Country Number must be a string."
    }),
    product_dealing: Joi.string().messages({
        "any.required": "Business Nature Number required.",
        "string.base": "Country Number must be a string."
    }),
    address_one: Joi.string().required().messages({
        "any.required": "Address one required.",
        "string.base": "Address one must be a string."
    }),
    address_two: Joi.string().required().messages({
        "any.required": "Address two required.",
        "string.base": "Address two must be a string."
    }),
    pincode: Joi.string().required().messages({
        "any.required": "Pincode two required.",
        "string.base": "Pincode two must be a string."
    }),
    country: Joi.string().required().messages({
        "any.required": "Country two required.",
        "string.base": "Country two must be a string."
    }),
    city: Joi.string().required().messages({
        "any.required": "City two required.",
        "string.base": "City two must be a string."
    }),
    company_document: Joi.string().messages({
        "any.required": "City two required.",
        "string.base": "City two must be a string."
    }),
    company_website: Joi.string().messages({
        "any.required": "Company Website  required.",
        "string.base": "Company Website must be a string."
    })
});



export const updateAdminCompanySchema = Joi.object({
    like_to_visit: Joi.string().required().messages({
        "any.required": "Like to visit is required.",
        "string.base": "Company Name must be a string."
    }),
    company_type: Joi.string().required().messages({
        "any.required": "Company Type required.",
        "string.base": "Company Type must be a string."
    }),
    address_type: Joi.string().required().messages({
        "any.required": "Address Type required.",
        "string.base": "Address Type must be a string."
    }),
    company_name: Joi.string().required().messages({
        "any.required": "Company Name required.",
        "string.base": "Company Name must be a string."
    }),
    company_email: Joi.string().required().messages({
        "any.required": "Company Email required.",
        "string.base": "Company Email must be a string."
    }),
    country_number: Joi.string().required().messages({
        "any.required": "Country Number required.",
        "string.base": "Country Number must be a string."
    }),
    country_code: Joi.string().required().messages({
        "any.required": "Country Code required.",
        "string.base": "Country Code must be a string."
    }),
    business_nature: Joi.string().messages({
        "any.required": "Business Nature Number required.",
        "string.base": "Country Number must be a string."
    }),
    address_one: Joi.string().required().messages({
        "any.required": "Address one required.",
        "string.base": "Address one must be a string."
    }),
    address_two: Joi.string().required().messages({
        "any.required": "Address two required.",
        "string.base": "Address two must be a string."
    }),
    pincode: Joi.string().required().messages({
        "any.required": "Pincode two required.",
        "string.base": "Pincode two must be a string."
    }),
    country: Joi.string().required().messages({
        "any.required": "Country two required.",
        "string.base": "Country two must be a string."
    }),
    city: Joi.string().required().messages({
        "any.required": "City two required.",
        "string.base": "City two must be a string."
    }),
    company_document: Joi.string().messages({
        "any.required": "City two required.",
        "string.base": "City two must be a string."
    }),
    company_website: Joi.string().messages({
        "any.required": "Company Website  required.",
        "string.base": "Company Website must be a string."
    }),
    admin_company_id: Joi.string().required().messages({
        "any.required": "Company Website  required.",
        "string.base": "Company Website must be a string."
    }),
    objective_of_visiting: Joi.string().messages({
        "any.required": "Business Nature Number required.",
        "string.base": "Country Number must be a string."
    }),
    first_learn_about: Joi.string().messages({
        "any.required": "Business Nature Number required.",
        "string.base": "Country Number must be a string."
    }),
    product_dealing: Joi.string().messages({
        "any.required": "Business Nature Number required.",
        "string.base": "Country Number must be a string."
    }),
});


export const deleteAdminCompanySchema = Joi.object({
    company_ids: Joi.array().required().messages({
        "any.required": "company_ids is required."
    }),
});