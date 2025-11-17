import { Request, Response, NextFunction, RequestHandler } from "express";
import {
  createDefaultFieldModule,
  deleteManyDefaultFields,
  getAllDefaultFields,
  getDefaultFieldById,
  getDefaultFieldByUserType,
  getDefaultFieldForAdmin,
  updateDefaultFieldById,
} from "../../domain/models/defaultField.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";

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
    optionUrl: string;
    optionPath: string;
    optionValue: string;
    optionName: string;
    optionRequestType: String;
    optionDepending: String;
    filevalidation: { fileType: []; fileSize: String };
    isAdmin: boolean; 
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
    const isAdminParam = req.query.isAdmin as string;

    // Convert string to boolean properly
    let isAdminBoolean: boolean | undefined;
    if (isAdminParam !== undefined) {
      isAdminBoolean = isAdminParam === 'true';
    }

    getAllDefaultFields(
      (error: any, result: any) => {
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
      },
      page,
      limit,
      search,
      isAdminBoolean
    );
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
        loggerMsg(
          "error",
          `Error in getDefaultFieldByIdController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Fetched default field by ID successfully");
      return successResponse(
        res,
        "Fetched default field by ID successfully",
        result
      );
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in getDefaultFieldByIdController: ${error.message}`
    );
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
        loggerMsg(
          "error",
          `Error in updateDefaultFieldByIdController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }
      loggerMsg("info", "Updated default field by ID successfully");
      return successResponse(
        res,
        "Updated default field by ID successfully",
        result
      );
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in updateDefaultFieldByIdController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

// get element by usertype
export const getDefaultFieldByUserTypeController: RequestHandler = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userType } = req.params;
    getDefaultFieldByUserType(userType, (error: any, result: any) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in getDefaultFieldByIdController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Fetched default field by user type successfully");
      return successResponse(
        res,
        "Fetched default field by user type successfully",
        result
      );
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in getDefaultFieldByIdController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

//  Get admin default fields controller
export const getDefaultFieldAdminController: RequestHandler = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    getDefaultFieldForAdmin((error: any, result: any) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in getDefaultFieldAdminController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Fetched admin default fields successfully");
      return successResponse(
        res,
        "Fetched admin default fields successfully",
        result
      );
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in getDefaultFieldAdminController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

export const deleteManyDefaultFieldsController: RequestHandler = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    let { filed_ids } = req.body;

    // Ensure we have something
    if (!filed_ids) {
      return ErrorResponse(res, "No field IDs provided");
    }

    // Handle both string and array input safely
    if (typeof filed_ids === "string") {
      filed_ids = filed_ids.split(",").map((id: string) => id.trim());
    } else if (!Array.isArray(filed_ids)) {
      return ErrorResponse(res, "Invalid filed_ids format — must be array or comma-separated string");
    }

    // Filter out any empty strings
    filed_ids = filed_ids.filter((id: string) => id);

    deleteManyDefaultFields(filed_ids, (error: any, result: any) => {
      if (error) {
        loggerMsg("error", `Error in deleteManyDefaultFieldsController: ${error.message}`);
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Deleted default fields successfully");
      return successResponse(res, "Deleted default fields successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in deleteManyDefaultFieldsController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};
