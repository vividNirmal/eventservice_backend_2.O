import { Request, Response, NextFunction, RequestHandler } from "express";
import {
  createDefaultFieldModule,
  getAllDefaultFields,
  getDefaultFieldById,
  getDefaultFieldByUserType,
  updateDefaultFieldById,
} from "../../domain/models/defaultField.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";
import { error } from "console";

interface AuthenticatedRequest extends Request {
  user?: {
    fieldName: string;
    fieldType: string;
    isRequired: boolean;
    requiredErrorText: string;
    placeHolder: string;
    inputType: string;
    isPrimary: boolean;
    fieldOptions: string[];
    validators: { type: string; text: string; regex: string }[];    
    userType: string;
    user_id: string;
    company_id: string;
  };
}

export const createDefaultFieldController: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const formData = req.body;

    createDefaultFieldModule(formData, (error: any, result: any) => {
      if (error) {
        loggerMsg("error", `Error in createFormController: ${error.message}`);
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Field created successfully");
      return successResponse(res, "Field created successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in createFormController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

export const getAllDefaultFieldsController: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const userType = req.query.userType as string;
    getAllDefaultFields( (error: any, result: any) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in getAllDefaultFieldsController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Fetched all default fields successfully");
      return successResponse(
        res,
        "Fetched all default fields successfully",
        result
      );
    }, page, limit, search);
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in getAllDefaultFieldsController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

//  get by id
export const getDefaultFieldByIdController: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
    next: NextFunction
) => {
  try {
    const { id } = req.params;
    getDefaultFieldById(id, (error: any, result: any) => {
      if (error) {
        loggerMsg("error", `Error in getDefaultFieldByIdController: ${error.message}`);
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Fetched default field by ID successfully");
      return successResponse(res, "Fetched default field by ID successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in getDefaultFieldByIdController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

// update by id
export const updateDefaultFieldByIdController: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
    next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    updateDefaultFieldById(id, updateData, (error: any, result: any) => {
      if (error) {
        loggerMsg("error", `Error in updateDefaultFieldByIdController: ${error.message}`);
        return ErrorResponse(res, error.message);
      }
        loggerMsg("info", "Updated default field by ID successfully");
        return successResponse(res, "Updated default field by ID successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in updateDefaultFieldByIdController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

// get element by usertype
export const getDefaultFieldByUserTypeController : RequestHandler = async(req :any,res:Response,next :NextFunction)=>{
  try{
    const {userType} = req.params;     
    getDefaultFieldByUserType(userType, (error: any, result: any) => {
      if (error) {
        loggerMsg("error", `Error in getDefaultFieldByIdController: ${error.message}`);
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Fetched default field by ID successfully");
      return successResponse(res, "Fetched default field by ID successfully", result);
    });
  }catch (error :any){
    loggerMsg("error", `Error in getDefaultFieldByIdController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
}
