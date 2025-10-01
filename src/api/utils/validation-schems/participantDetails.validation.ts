import Joi from 'joi';

export const getParticipantDetailsSchema = Joi.object({
        event_id: Joi.string().required().messages({
            "any.required": "Event Id is required.",
            "string.base": "Event Id must be a string."
        }),
        user_token: Joi.string().required().messages({
            "any.required": "User Token is required.",
            "string.base": "User Token must be a string."
        }),
        type: Joi.string().required().messages({
            "any.required": "Type is required.",
        }),
    });

export const toggleParticipantBlockStatusSchema = Joi.object({
        participant_id: Joi.string().required().messages({
            "any.required": "Participant ID is required.",
            "string.base": "Participant ID must be a string."
        }),
        isBlocked: Joi.alternatives().try(
            Joi.boolean(),
            Joi.string().valid('true', 'false').custom((value, helpers) => {
                return value === 'true';
            })
        ).required().messages({
            "any.required": "isBlocked status is required.",
            "alternatives.match": "isBlocked must be a boolean value or 'true'/'false' string."
        }),
    });
    