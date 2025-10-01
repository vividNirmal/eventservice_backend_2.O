import { Request, Response } from "express";
import { loggerMsg } from "../../lib/logger";
import { successCreated, successResponse ,ErrorResponse } from "../../helper/apiResponse";
import { storeAdminCompany,adminCompanyList ,updateAdminCompany} from "../../domain/models/adminCompany.model";
import AdminCompanySchema from "../../domain/schema/adminCompany.schema";
import multer from "multer"
import path from "path"
import fs from "fs";
import { env } from "process";

interface FileWithBuffer extends Express.Multer.File {
    buffer: Buffer;
}
  
const upload = multer();

export const storeAdminCompanyController = async (req: Request, res: Response) => {
    try {
        const files = req.files as FileWithBuffer[];
        console.log(files);
        files.forEach((file) => {
            const field_name = file.fieldname;
            const fileName = `${Date.now()}-${file.originalname}`;

            const savePath = path.join("uploads", fileName);

            fs.writeFileSync(savePath, file.buffer);

            req.body[field_name] = savePath;
        });

        console.log(req.body)
        console.log(req.user)
        // return false;
        storeAdminCompany(req.user,req.body, (error: any, result: any) => {
            if (error) {
                return ErrorResponse(res, error.message);
            }

            return successResponse(res, "Get Admin Event List", { result });
        });
    } catch (error) {
        return ErrorResponse(res, 'An error occurred during event retrieval.');
    }
};


export const getAdminCompanyList = async (req: Request, res: Response) => {
    try {
            const { page = 1, pageSize = 10, searchQuery = "" } = req.query;
            adminCompanyList(req.user,req.body,
                parseInt(page as string),
                parseInt(pageSize as string),
                searchQuery as string, (error:any, result:any) => {
                if (error) {
                    return res.status(500).json({
                        code: "INTERNAL_SERVER_ERROR",
                        message: error instanceof Error ? error.message : "An unexpected error occurred."
                    });
                }
                return successResponse(res, 'Get Admin Event List', 
                    result,
                )
            });
        } catch (error) {
            return  ErrorResponse(res,'An error occurred during user registration.')
        }
};

export const getAdminCompanyDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
    
        const company_details = await AdminCompanySchema.findById(id);
        
        if (!company_details) {
            return ErrorResponse(res, "User not found");
        }
    
        const baseUrl = env.BASE_URL; 
    
        if (company_details.company_document) {
            company_details.company_document = baseUrl +'/'+ company_details.company_document;
        }
    
        // if (user.event_image) {
        //     user.event_image = baseUrl +'/'+ user.event_image;
        // }

        // if (user.show_location_image) {
        //     user.show_location_image = baseUrl +'/'+ user.show_location_image;
        // }else{
        //     user.show_location_image = "";
        // }

        // if (user.event_sponsor) {
        //     user.event_sponsor = baseUrl +'/'+ user.event_sponsor;
        // }else{
        //     user.event_sponsor = "";
        // }

        // const company_visit = await reasonSchema.find({ event_id: id });
        // const visitReason = await companyActivitySchema.find({ event_id: id });
    
        return successResponse(res, 'Get Admin Event Details', {
            company_details
        });
        
    } catch (error) {
        return ErrorResponse(res, 'An error occurred during event retrieval.');
    }
};

export const updateAdminCompanyController = async (req: Request, res: Response) => {
    try {
        const files = req.files as FileWithBuffer[];
        
        files.forEach((file) => {
            const field_name = file.fieldname;
            const fileName = `${Date.now()}-${file.originalname}`;

            const savePath = path.join("uploads", fileName);

            fs.writeFileSync(savePath, file.buffer);

            req.body[field_name] = savePath;
        });

        console.log(req.body)
        console.log(req.user)
        updateAdminCompany(req.user,req.body, (error: any, result: any) => {
            if (error) {
                return ErrorResponse(res, error.message);
            }

            return successResponse(res, "Get Admin Event List", { result });
        });
    } catch (error) {
        return ErrorResponse(res, 'An error occurred during event retrieval.');
    }
};

export const deleteAdminCompanyController = async (req: Request, res: Response) => {
    try {

        const { company_ids } = req.body; 

        if (!company_ids || !Array.isArray(company_ids) || company_ids.length === 0) {
            return ErrorResponse(res, "No event IDs provided");
        }
        
        const events = await AdminCompanySchema.find({ _id: { $in: company_ids } });
        
        if (events.length === 0) {
            return ErrorResponse(res, "No matching events found");
        }
        await AdminCompanySchema.deleteMany({ _id: { $in: company_ids } });
        return successResponse(res, "Admin Company deleted successfully", {});
    } catch (error) {
        return ErrorResponse(res,'An error occurred during event retrieval.')
    }
};