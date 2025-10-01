import Joi from 'joi';

export const getEventDetailValidation = Joi.object({
    event_slug: Joi.string().required().messages({
        "any.required": "event Slug required is required."
    }),
    sub_domain: Joi.string().required().messages({
        "any.required": "Subdoamin is required."
    }),
});

export const scanParticipantFaceSchema = Joi.object({
    event_id: Joi.string().required().messages({
        "any.required": "event Slug required is required."
    }),
    scanner_type: Joi.string().required().messages({
        "any.required": "event Slug required is required."
    })
})
