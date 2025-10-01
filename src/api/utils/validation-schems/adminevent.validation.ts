import Joi from 'joi';

export const adminEventSchema = Joi.object({
    event_id: Joi.string().messages({
    }),
    company_name: Joi.string().required().messages({
        "any.required": "Company Name is required.",
        "string.base": "Company Name must be a string."
    }),
    event_title: Joi.string().required().messages({
        "any.required": "Event Title is required.",
        "string.base": "Event Title must be a string."
    }),
    event_slug: Joi.string().required().messages({
        "any.required": "Event Slug is required.",
        "string.base": "Event Slug must be a string."
    }),
    start_date: Joi.array()
    .items(
        Joi.string().required().messages({
            "any.required": "Each Reason for Visiting is required.",
            "string.base": "Each Reason for Visiting must be a string."
        })
    )
    .required()
    .messages({
        "any.required": "Reason for Visiting is required.",
        "array.base": "Reason for Visiting must be an array of strings."
    }),
    end_date: Joi.array()
    .items(
        Joi.string().required().messages({
            "any.required": "Each Reason for Visiting is required.",
            "string.base": "Each Reason for Visiting must be a string."
        })
    )
    .required()
    .messages({
        "any.required": "Reason for Visiting is required.",
        "array.base": "Reason for Visiting must be an array of strings."
    }),
    event_description: Joi.string().required().messages({
        "any.required": "Event Description is required.",
        "string.base": "Event Description must be a string."
    }),
    google_map_url: Joi.string().uri().required().messages({
        "any.required": "Google Map URL is required.",
        "string.uri": "Google Map URL must be a valid URI.",
        "string.base": "Google Map URL must be a string."
    }),
    address: Joi.string().required().messages({
        "any.required": "Address is required.",
        "string.base": "Address must be a string."
    }),
    event_type: Joi.string().required().messages({
        "any.required": "Event Type is required.",
        "string.base": "Event Type must be a string."
    }),
    event_logo: Joi.string().uri().messages({
        "string.uri": "Event Logo must be a valid URI.",
        "string.base": "Event Logo must be a string."
    }),
    event_image: Joi.string().uri().messages({
        "string.uri": "Event Image must be a valid URI.",
        "string.base": "Event Image must be a string."
    }),
    event_sponsor: Joi.string().uri().messages({
        "string.uri": "Event Sponsor must be a valid URI.",
        "string.base": "Event Sponsor must be a string."
    }),
    show_location_image: Joi.string().uri().messages({
        "string.uri": "Event Image must be a valid URI.",
        "string.base": "Event Image must be a string."
    }),
    organizer_name: Joi.string().required().messages({
        "any.required": "Organizer Name is required.",
        "string.base": "Organizer Name must be a string."
    }),
    organizer_email: Joi.string().email().required().messages({
        "any.required": "Organizer Email is required.",
        "string.email": "Organizer Email must be a valid email address.",
        "string.base": "Organizer Email must be a string."
    }),
    with_face_scanner:Joi.number().required().messages({
        "any.required": "With face scanner About Event is required.",
        "string.base": "With face scanner About Event must be a integer."
    }),
    organizer_phone: Joi.string()
    .pattern(/^\d{10,15}$/)
    .required()
    .messages({
        "any.required": "Organizer Phone is required.",
        "string.pattern.base": "Organizer Phone must be a valid phone number with 10-15 digits.",
        "string.base": "Organizer Phone must be a string."
    })
});


export const adminUpdateEventSchema = Joi.object({
    company_name: Joi.string().required().messages({
        "any.required": "Company Name is required.",
        "string.base": "Company Name must be a string."
    }),
    event_title: Joi.string().required().messages({
        "any.required": "Event Title is required.",
        "string.base": "Event Title must be a string."
    }),
    event_slug: Joi.string().required().messages({
        "any.required": "Event Slug is required.",
        "string.base": "Event Slug must be a string."
    }),
    event_id: Joi.string().required().messages({
        "any.required": "Event Slug is required.",
        "string.base": "Event Slug must be a string."
    }),
    start_date: Joi.array()
    .items(
        Joi.string().required().messages({
            "any.required": "Each Reason for Visiting is required.",
            "string.base": "Each Reason for Visiting must be a string."
        })
    )
    .required()
    .messages({
        "any.required": "Reason for Visiting is required.",
        "array.base": "Reason for Visiting must be an array of strings."
    }),
    end_date: Joi.array()
    .items(
        Joi.string().required().messages({
            "any.required": "Each Reason for Visiting is required.",
            "string.base": "Each Reason for Visiting must be a string."
        })
    )
    .required()
    .messages({
        "any.required": "Reason for Visiting is required.",
        "array.base": "Reason for Visiting must be an array of strings."
    }),
    event_description: Joi.string().required().messages({
        "any.required": "Event Description is required.",
        "string.base": "Event Description must be a string."
    }),
    
    google_map_url: Joi.string().uri().required().messages({
        "any.required": "Google Map URL is required.",
        "string.uri": "Google Map URL must be a valid URI.",
        "string.base": "Google Map URL must be a string."
    }),
    address: Joi.string().required().messages({
        "any.required": "Address is required.",
        "string.base": "Address must be a string."
    }),
    event_type: Joi.string().required().messages({
        "any.required": "Event Type is required.",
        "string.base": "Event Type must be a string."
    }),
    organizer_name: Joi.string().required().messages({
        "any.required": "Organizer Name is required.",
        "string.base": "Organizer Name must be a string."
    }),
    organizer_email: Joi.string().email().required().messages({
        "any.required": "Organizer Email is required.",
        "string.email": "Organizer Email must be a valid email address.",
        "string.base": "Organizer Email must be a string."
    }),
    organizer_phone: Joi.string()
    .pattern(/^\d{10,15}$/)
    .required()
    .messages({
        "any.required": "Organizer Phone is required.",
        "string.pattern.base": "Organizer Phone must be a valid phone number with 10-15 digits.",
        "string.base": "Organizer Phone must be a string."
    }),
    with_face_scanner:Joi.number().required().messages({
        "any.required": "With face scanner About Event is required.",
        "string.base": "With face scanner About Event must be a integer."
    }),
    show_location_image: Joi.string().messages({
        "string.uri": "Event Image must be a valid URI.",
        "string.base": "Event Image must be a string."
    }),
    getting_show_location: Joi.string().messages({
        "string.uri": "Event Image must be a valid URI.",
        "string.base": "Event Image must be a string."
    }),
});

export const deleteEventSchema = Joi.object({
    events_ids: Joi.array().required().messages({
        "any.required": "event_ids is required."
    }),
});

export const extraEventDetails = Joi.object({
    id: Joi.string().required().messages({
        "any.required": "id is required."
    }),
});

export const updateExtraEventDetails = Joi.object({
    event_id: Joi.string().required().messages({
        "any.required": "event_id is required."
    }),
    company_activity: Joi.array().messages({
        "any.required": "company_activity is required."
    }),
    reason_for_visiting: Joi.array().messages({
        "any.required": "reason_for_visiting is required."
    }),
    sort_des_about_event: Joi.string().required().messages({
        "any.required": "sort_des_about_event is required."
    }),
});

export const getDeviceUrlSchema = Joi.object({
    id: Joi.string().required().messages({
        "any.required": "id is required."
    }),
    type: Joi.string().valid("0", "1").required().messages({
        "any.required": "type is required.",
        "any.only": "type must be either '0' or '1'."
    })
});

export const verifyDeviceAndLoginSchema = Joi.object({
    key: Joi.string().required().messages({
        "any.required": "key is required."
    }),
    deviceKey: Joi.string().required().messages({
        "any.required": "deviceKey is required."
    }),
});

export const verifyDeviceDirectAccessSchema = Joi.object({
    deviceKey: Joi.string().required().messages({
        "any.required": "deviceKey is required."
    }),
});

export const generateFormUrlSchema = Joi.object({
    event_id: Joi.string().required().messages({
        "any.required": "event_id is required."
    }),
    form_id: Joi.string().required().messages({
        "any.required": "form_id is required."
    })
});


