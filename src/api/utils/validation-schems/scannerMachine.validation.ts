import Joi from 'joi';

export const addScannerMachineSchema = Joi.object({
    scanner_name: Joi.string().required().messages({
        "any.required": "scanner_name is required."
    }),
    // scanner_unique_id will be auto-generated in backend, not required from frontend
    device_key: Joi.string().required().messages({
        "any.required": "device_key is required."
    }),
    device_type: Joi.string().required().messages({
        "any.required": "device_type is required."
    }),
    // Optional assignment fields - can be provided during creation or later
    company_id: Joi.string().optional().allow(null, '').messages({
        "string.base": "company_id must be a string."
    }),
    expired_date: Joi.date().optional().allow(null, '').messages({
        "date.base": "expired_date must be a valid date."
    }),
});

export const updateScannerMachineSchema = Joi.object({
    scanner_machine_id: Joi.string().required().messages({
        "any.required": "scanner_machine_id is required."
    }),
    scanner_name: Joi.string().required().messages({
        "any.required": "scanner_name is required."
    }),
    // scanner_unique_id is not editable after creation
    device_key: Joi.string().required().messages({
        "any.required": "device_key is required."
    }),
    device_type: Joi.string().required().messages({
        "any.required": "device_type is required."
    }),
    // Optional assignment fields - can be updated
    company_id: Joi.string().optional().allow(null, '').messages({
        "string.base": "company_id must be a string."
    }),
    expired_date: Joi.date().optional().allow(null, '').messages({
        "date.base": "expired_date must be a valid date."
    }),
});


export const deleteScannerMachineSchema = Joi.object({
    scannerMachine_ids: Joi.array().required().messages({
        "any.required": "scannerMachine_ids is required."
    })
});

export const assignScannerMachineSchema = Joi.object({
    company_id: Joi.string().required().messages({
        "any.required": "company_id is required."
    }),
    password: Joi.string().required().messages({
        "any.required": "password is required."
    }),
    expired_date: Joi.any().required().messages({
        "any.required": "Expired date is required."
    }),
    scannerMachine_ids: Joi.array().required().messages({
        "any.required": "scannerMachine_ids is required."
    })
});





