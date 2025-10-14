import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';
import multer from "multer";
const upload = multer();

// export const validateRequest = (schema: ObjectSchema) => {
//     return (req: Request, res: Response, next: NextFunction) => {
//         console.log(Request);
//         const { error } = schema.validate(req.body, { abortEarly: false });
//         // abortEarly => if true then sends error on first failure => if false then sends all the failure errors

//         if (error) {
//             return res.status(400).json({
//                 status: "error",
//                 code: "VALIDATION_ERROR",
//                 message: "Validation failed for the request.",
//                 error: error.details.map(err => ({
//                     message: err.message,
//                     path: err.path
//                 }))
//             });
//         }

//         next();
//     };
// };

export const validateRequest = (schema: ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {                
        // Check if files are already processed by another multer middleware
        if (req.files || req.file) {            
            // Files already processed, skip multer processing
            const dataToValidate = {
                ...req.body, // JSON body or form-data (parsed by multer)
                ...req.query, // Query parameters
                ...req.params, // URL parameters
            };            
            const { error } = schema.validate(dataToValidate, { abortEarly: false });

            if (error) {                
                return res.status(400).json({
                    status: "error",
                    code: "VALIDATION_ERROR",
                    message: "Validation failed for the request.",
                    errors: error.details.map(err => ({
                        message: err.message,
                        path: err.path,
                    })),
                });
            }            
            next();
            return;
        }        
        // Only use multer if files haven't been processed yet
        upload.any()(req, res, (err) => {
            if (err) {
                
                return res.status(500).json({
                    status: "error",
                    code: "MULTER_ERROR",
                    message: "An error occurred while processing form-data."
                });
            }            

            const dataToValidate = {
                ...req.body, // JSON body or form-data (parsed by multer)
                ...req.query, // Query parameters
                ...req.params, // URL parameters
            };

            

            const { error } = schema.validate(dataToValidate, { abortEarly: false });

            if (error) {
                
                return res.status(400).json({
                    status: "error",
                    code: "VALIDATION_ERROR",
                    message: "Validation failed for the request.",
                    errors: error.details.map(err => ({
                        message: err.message,
                        path: err.path,
                    })),
                });
            }            
            next();
        });
    };
};

export const validateRequestBody = (schema: ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Check if files are already processed by another multer middleware
        if (req.files || req.file) {
            // Files already processed, skip multer processing
            const { error } = schema.validate(req.body, { abortEarly: false });

            if (error) {
                return res.status(400).json({
                    status: "error",
                    code: "VALIDATION_ERROR",
                    message: "Validation failed for the request.",
                    errors: error.details.map(err => ({
                        message: err.message,
                        path: err.path,
                    })),
                });
            }

            next();
            return;
        }

        // Only use multer if files haven't been processed yet
        upload.any()(req, res, (err) => {
            if (err) {
                console.log(err)
                return res.status(500).json({
                    status: "error",
                    code: "MULTER_ERROR",
                    message: "An error occurred while processing form-data."
                });
            }

            // Only validate the request body, not params or query
            const { error } = schema.validate(req.body, { abortEarly: false });

            if (error) {
                return res.status(400).json({
                    status: "error",
                    code: "VALIDATION_ERROR",
                    message: "Validation failed for the request.",
                    errors: error.details.map(err => ({
                        message: err.message,
                        path: err.path,
                    })),
                });
            }

            next();
        });
    };
};