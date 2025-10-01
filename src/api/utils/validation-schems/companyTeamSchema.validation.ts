import Joi from 'joi';

export const companyTeamSchema = Joi.object({
    first_name: Joi.string().required().messages({
        "any.required": "First Name required.",
        "string.base": "First Name must be a string."
    }),
    last_name: Joi.string().required().messages({
        "any.required": "Last Name required.",
        "string.base": "Last Name must be a string."
    }),
    email: Joi.string().required().messages({
        "any.required": "Email required.",
        "string.base": "Email must be a string."
    }),
    country_code: Joi.string().required().messages({
        "any.required": "Country Code required.",
        "string.base": "Country Code must be a string."
    }),
    contact_no: Joi.string().required().messages({
        "any.required": "Contact No required.",
        "string.base": "Contact No must be a string."
    }),
    ownership: Joi.string().required().messages({
        "any.required": "Ownership required.",
        "string.base": "Ownership must be a string."
    }),
    birth_date: Joi.string().messages({
        "any.required": "Birth Date required.",
        "string.base": "Birth Date must be a string."
    }),
    gender: Joi.string().messages({
        "any.required": "Gender required.",
        "string.base": "Gender must be a string."
    }),
    address_one: Joi.string().messages({
        "any.required": "Address One required.",
        "string.base": "Address One must be a string."
    }),
    address_two: Joi.string().messages({
        "any.required": "Address Two required.",
        "string.base": "Address Two must be a string."
    }),
    pincode: Joi.string().required().messages({
        "any.required": "Pincode required.",
        "string.base": "Pincode must be a string."
    }),
    country: Joi.string().required().messages({
        "any.required": "Country required.",
        "string.base": "Country must be a string."
    }),
    city: Joi.string().required().messages({
        "any.required": "City required.",
        "string.base": "City must be a string."
    }),
    passport_no: Joi.string().required().messages({
        "any.required": "Passport No required.",
        "string.base": "Passport No must be a string."
    }),
    admin_company_id: Joi.string().required().messages({
        "any.required": "Admin Compnay Id required.",
        "string.base": "Admin Compnay Id must be a string."
    }),
    valid_upto: Joi.string().messages({
        "any.required": "Valid Upto required.",
        "string.base": "Valid Upto must be a string."
    }),
    origin: Joi.string().messages({
        "any.required": "Origin  required.",
        "string.base": "Origin must be a string."
    }),
    visa_recommendation: Joi.string().messages({
        "any.required": "Visa Recommendation required.",
        "string.base": "Visa Recommendation be a string."
    }),
    business_card: Joi.string().messages({
        "any.required": "business card  required.",
        "string.base": "business card must be a file"
    })
});

export const updateCompanyTeamSchema = Joi.object({
    first_name: Joi.string().required().messages({
        "any.required": "First Name required.",
        "string.base": "First Name must be a string."
    }),
    last_name: Joi.string().required().messages({
        "any.required": "Last Name required.",
        "string.base": "Last Name must be a string."
    }),
    email: Joi.string().required().messages({
        "any.required": "Email required.",
        "string.base": "Email must be a string."
    }),
    country_code: Joi.string().required().messages({
        "any.required": "Country Code required.",
        "string.base": "Country Code must be a string."
    }),
    contact_no: Joi.string().required().messages({
        "any.required": "Contact No required.",
        "string.base": "Contact No must be a string."
    }),
    ownership: Joi.string().required().messages({
        "any.required": "Ownership required.",
        "string.base": "Ownership must be a string."
    }),
    birth_date: Joi.string().messages({
        "any.required": "Birth Date required.",
        "string.base": "Birth Date must be a string."
    }),
    gender: Joi.string().messages({
        "any.required": "Gender required.",
        "string.base": "Gender must be a string."
    }),
    address_one: Joi.string().messages({
        "any.required": "Address One required.",
        "string.base": "Address One must be a string."
    }),
    address_two: Joi.string().messages({
        "any.required": "Address Two required.",
        "string.base": "Address Two must be a string."
    }),
    pincode: Joi.string().required().messages({
        "any.required": "Pincode required.",
        "string.base": "Pincode must be a string."
    }),
    country: Joi.string().required().messages({
        "any.required": "Country required.",
        "string.base": "Country must be a string."
    }),
    city: Joi.string().required().messages({
        "any.required": "City required.",
        "string.base": "City must be a string."
    }),
    passport_no: Joi.string().required().messages({
        "any.required": "Passport No required.",
        "string.base": "Passport No must be a string."
    }),
    valid_upto: Joi.string().messages({
        "any.required": "Valid Upto required.",
        "string.base": "Valid Upto must be a string."
    }),
    origin: Joi.string().messages({
        "any.required": "Origin  required.",
        "string.base": "Origin must be a string."
    }),
    visa_recommendation: Joi.string().messages({
        "any.required": "Visa Recommendation required.",
        "string.base": "Visa Recommendation be a string."
    }),
    business_card: Joi.string().messages({
        "any.required": "business card  required.",
        "string.base": "business card must be a file"
    }),
    team_id: Joi.string().messages({
        "any.required": "Team Id  required.",
        "string.base": "Team Id must be a file"
    }),
    passport_image: Joi.string().messages({
        "any.required": "business card  required.",
        "string.base": "business card must be a file"
    }),
    profile_picture: Joi.string().messages({
        "any.required": "business card  required.",
        "string.base": "business card must be a file"
    })
});

export const deleteCompanyTeamSchema = Joi.object({
    team_ids: Joi.array().required().messages({
        "any.required": "team_ids is required."
    }),
});