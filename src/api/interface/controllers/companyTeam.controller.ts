import { Request, Response } from "express";
import { loggerMsg } from "../../lib/logger";
import { successCreated, successResponse ,ErrorResponse } from "../../helper/apiResponse";
import { storeCompanyTeamModel,updateCompanyTeam,companyTeamList} from "../../domain/models/companyTeam.model";
import CompanyTeamSchema from "../../domain/schema/companyTeam.schema";
import multer from "multer"
import path from "path"
import fs from "fs";
import { env } from "process";

interface FileWithBuffer extends Express.Multer.File {
    buffer: Buffer;
}
  
const upload = multer();

export const storeCompanyTeamController = async (req: Request, res: Response) => {
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

        storeCompanyTeamModel(req.user,req.body, (error: any, result: any) => {
            if (error) {
                return ErrorResponse(res, error.message);
            }

            return successResponse(res, "Get Admin Event List", { result });
        });
    } catch (error) {
        return ErrorResponse(res, 'An error occurred during event retrieval.');
    }
};


export const getCompanyTeamList = async (req: Request, res: Response) => {
    try {
            const { page = 1, pageSize = 10, search = "" , user_type = "",origin = "",all_date="",company_id="" } = req.query;
            companyTeamList(req.user,req.body,
                parseInt(page as string),
                parseInt(pageSize as string),
                search as string,
                user_type as string,
                origin as string,
                all_date as string,
                company_id as string, (error:any, result:any) => {
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

export const getCompanyTeamDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
    
        const team_details = await CompanyTeamSchema.findById(id);
        
        if (!team_details) {
            return ErrorResponse(res, "Team Member not found");
        }
    
        const baseUrl = env.BASE_URL; 
    
        if (team_details.passport_image) {
            team_details.passport_image = baseUrl +'/'+ team_details.passport_image;
        }
        if (team_details.profile_picture) {
            team_details.profile_picture = baseUrl +'/'+ team_details.profile_picture;
        }
        if (team_details.business_card) {
            team_details.business_card = baseUrl +'/'+ team_details.business_card;
        }
    
        return successResponse(res, 'Get Team Details', {
            team_details
        });
        
    } catch (error) {
        return ErrorResponse(res, 'An error occurred during event retrieval.');
    }
};

export const updateCompanyTeamController = async (req: Request, res: Response) => {
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
        updateCompanyTeam(req.user,req.body, (error: any, result: any) => {
            if (error) {
                return ErrorResponse(res, error.message);
            }

            return successResponse(res, "Get Admin Event List", { result });
        });
    } catch (error) {
        return ErrorResponse(res, 'An error occurred during event retrieval.');
    }
};

export const deleteCompanyTeamController = async (req: Request, res: Response) => {
    try {

        const { team_ids } = req.body; 

        if (!team_ids || !Array.isArray(team_ids) || team_ids.length === 0) {
            return ErrorResponse(res, "No event IDs provided");
        }
        
        const events = await CompanyTeamSchema.find({ _id: { $in: team_ids } });
        
        if (events.length === 0) {
            return ErrorResponse(res, "No matching events found");
        }
        await CompanyTeamSchema.deleteMany({ _id: { $in: team_ids } });
        return successResponse(res, "Admin Company deleted successfully", {});
    } catch (error) {
        return ErrorResponse(res,'An error occurred during event retrieval.')
    }
};