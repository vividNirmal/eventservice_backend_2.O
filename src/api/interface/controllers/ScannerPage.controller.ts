import { Request, Response } from "express";
import { successResponse ,ErrorResponse } from "../../helper/apiResponse";
import companySchema from "../../domain/schema/company.schema";
import Scannermachine from "../../domain/schema/scannerMachine.schema";
import { scannerLogin } from "../../domain/models/user.model";
import scannerTokenSchema from "../../domain/schema/scannerToken.schema";
import eventHostSchema from "../../domain/schema/eventHost.schema";

    export const getEventDetailsSlug = async (req: Request, res: Response) => {
        try {
            const { event_slug, sub_domain } = req.body;
            const company_details = await companySchema.findOne({ subdomain : sub_domain});
            if(!company_details){
                return  ErrorResponse(res,'Company not found.')
            }

            if (company_details.status != 1) {
                return ErrorResponse(res, 'Company is not active.');
            }

            const event_details = await eventHostSchema.findOne({event_slug:event_slug});
            if(!event_details){
                return  ErrorResponse(res,'Event not found.')
            }

            if(event_details.company_id != company_details._id){    
                return  ErrorResponse(res,`Event does not belong to the company. ${event_details.company_id}`)
            }

            if (!event_details.endDate) {
                return ErrorResponse(res, 'Invalid event end date.');
            }

            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);

            const eventEndDate = new Date(event_details.endDate);

            if (eventEndDate < currentDate) {
            return ErrorResponse(res, 'Event expired.');
            }
            console.log('company_details._id',company_details._id)
            const scanner_machine_list = await Scannermachine.find({company_id:company_details._id});

            const result = {
                event_details,
                scanner_machine_list
            }
            return successResponse(res, 'Event details.', result);

        } catch (error) {
            console.log(error)
        return  ErrorResponse(res,'An error occurred during user registration.')
        }
    }

    export const scannerPageLogin = async (req: Request, res: Response) => {
        try {
            const { password,machine_id,type,subdomain } = req.body;
    
            scannerLogin(req.body, (error:any, result:any) => {
                if (error) {
                    return ErrorResponse(res,error.message);
                }
                return successResponse(res, "Login User Successfully", result);
            });
        } catch (error) {
    
            return ErrorResponse(res,'An error occurred during user registration.');
           
        }
    }

export const logoutAllScanners = async (req: Request, res: Response) => {
  try {
    const result = await scannerTokenSchema.deleteMany({}); // ❌ Clear all tokens

    return successResponse(res, "All scanners logged out successfully", result);
  } catch (error) {
    console.error("Logout all scanners error:", error);
    return ErrorResponse(res, "An error occurred while logging out all scanners.");
  }
};



