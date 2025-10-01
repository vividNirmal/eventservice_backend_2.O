import Joi from "joi";

export const createDeviceConfigurationSchema = Joi.object({
    scanner_machine_id: Joi.string().required().messages({
        "string.empty": "Scanner machine ID is required",
        "any.required": "Scanner machine ID is required"
    }),
    company_id: Joi.string().required().messages({
        "string.empty": "Company ID is required",
        "any.required": "Company ID is required"
    }),
    event_id: Joi.string().required().messages({
        "string.empty": "Event ID is required", 
        "any.required": "Event ID is required"
    }),
    scanner_name: Joi.string().required().messages({
        "string.empty": "Scanner name is required",
        "any.required": "Scanner name is required"
    }),
    scanner_unique_id: Joi.string().required().messages({
        "string.empty": "Scanner unique ID is required",
        "any.required": "Scanner unique ID is required"
    }),
    device_type: Joi.string().valid("0", "1").required().messages({
        "string.empty": "Device type is required",
        "any.required": "Device type is required",
        "any.only": "Device type must be either '0' (Check In) or '1' (Check Out)"
    }),
    entry_mode: Joi.string().valid("0", "1").required().messages({
        "string.empty": "Entry mode is required",
        "any.required": "Entry mode is required",
        "any.only": "Entry mode must be either '0' (Check In) or '1' (Check Out)"
    }),
    device_key: Joi.string().required().messages({
        "string.empty": "Device key is required",
        "any.required": "Device key is required"
    }),
    location_name: Joi.string().required().messages({
        "string.empty": "Location name is required",
        "any.required": "Location name is required"
    }),
    check_in_area: Joi.string().required().messages({
        "string.empty": "Check in area is required",
        "any.required": "Check in area is required"
    }),
    check_in_by: Joi.string().valid("reg_no", "regno_invitation").required().messages({
        "string.empty": "Check in by is required",
        "any.required": "Check in by is required",
        "any.only": "Check in by must be either 'reg_no' or 'regno_invitation'"
    }),
    device_access: Joi.string().valid("user", "admin", "all").default("all").messages({
        "any.only": "Device access must be 'user', 'admin', or 'all'"
    }),
    badge_category: Joi.string().valid("vip", "general", "staff", "speaker", "sponsor", "all").default("all").messages({
        "any.only": "Badge category must be 'vip', 'general', 'staff', 'speaker', 'sponsor', or 'all'"
    }),
    comment: Joi.string().allow("").optional()
});

export const updateDeviceConfigurationSchema = Joi.object({
    id: Joi.string().required().messages({
        "string.empty": "Configuration ID is required",
        "any.required": "Configuration ID is required"
    }),
    scanner_machine_id: Joi.string().optional(),
    company_id: Joi.string().optional(),
    event_id: Joi.string().optional(),
    scanner_name: Joi.string().optional(),
    scanner_unique_id: Joi.string().optional(),
    device_type: Joi.string().valid("0", "1").optional().messages({
        "any.only": "Device type must be either '0' (Check In) or '1' (Check Out)"
    }),
    entry_mode: Joi.string().valid("0", "1").optional().messages({
        "any.only": "Entry mode must be either '0' (Check In) or '1' (Check Out)"
    }),
    device_key: Joi.string().optional(),
    location_name: Joi.string().optional(),
    check_in_area: Joi.string().optional(),
    check_in_by: Joi.string().valid("reg_no", "regno_invitation").optional().messages({
        "any.only": "Check in by must be either 'reg_no' or 'regno_invitation'"
    }),
    device_access: Joi.string().valid("user", "admin", "all").optional().messages({
        "any.only": "Device access must be 'user', 'admin', or 'all'"
    }),
    badge_category: Joi.string().valid("vip", "general", "staff", "speaker", "sponsor", "all").optional().messages({
        "any.only": "Badge category must be 'vip', 'general', 'staff', 'speaker', 'sponsor', or 'all'"
    }),
    comment: Joi.string().allow("").optional()
});

export const deleteDeviceConfigurationSchema = Joi.object({
    id: Joi.string().required().messages({
        "string.empty": "Configuration ID is required",
        "any.required": "Configuration ID is required"
    })
});

export const getDeviceConfigurationByCompanySchema = Joi.object({
    company_id: Joi.string().required().messages({
        "string.empty": "Company ID is required",
        "any.required": "Company ID is required"  
    }),
    event_id: Joi.string().required().messages({
        "string.empty": "Event ID is required",
        "any.required": "Event ID is required"
    })
});