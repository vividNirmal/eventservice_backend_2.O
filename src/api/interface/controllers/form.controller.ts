import { Request, Response } from "express";
import { loggerMsg } from "../../lib/logger";
import { successResponse, ErrorResponse } from "../../helper/apiResponse";
import {
    getAllForms,
    getFormById,
    createForm,
    updateForm,
    deleteForm,
    addPageToForm,
    exportFormPagesAsJson,
    importFormPagesFromJson
} from "../../domain/models/form.model";

interface AuthenticatedRequest extends Request {
    user?: {
        user_id: string;
        company_id: string;
    };
}

/**
 * Get Form List
 */
export const getFormListController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const userType = req.query.userType as string;
        const eventId = req.query.eventId as string;

        getAllForms((error: any, result: any) => {
            if (error) {
                loggerMsg("error", `Error in getFormListController: ${error.message}`);
                return ErrorResponse(res, error.message);
            }

            loggerMsg("info", "Forms retrieved successfully");
            return successResponse(res, "Forms retrieved successfully", result);
        }, page, limit, search, userType, eventId);

    } catch (error: any) {
        loggerMsg("error", `Error in getFormListController: ${error.message}`);
        return ErrorResponse(res, error.message);
    }
};

/**
 * Get Form Details
 */
export const getFormDetailsController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;

        getFormById(id, (error: any, result: any) => {
            if (error) {
                loggerMsg("error", `Error in getFormDetailsController: ${error.message}`);
                return ErrorResponse(res, error.message);
            }

            loggerMsg("info", "Form details retrieved successfully");
            return successResponse(res, "Form details retrieved successfully", result);
        });

    } catch (error: any) {
        loggerMsg("error", `Error in getFormDetailsController: ${error.message}`);
        return ErrorResponse(res, error.message);
    }
};

/**
 * Create Form
 */
export const createFormController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { formName, userType, pages, companyId, eventId } = req.body;

        const formData = {
            formName,
            userType,
            pages: pages || [], // 👈 replaces formFields
            companyId: companyId || req.user?.company_id || null,
            eventId: eventId || null
        };

        createForm(formData, (error: any, result: any) => {
            if (error) {
                loggerMsg("error", `Error in createFormController: ${error.message}`);
                return ErrorResponse(res, error.message);
            }

            loggerMsg("info", "Form created successfully");
            return successResponse(res, "Form created successfully", result);
        });

    } catch (error: any) {
        loggerMsg("error", `Error in createFormController: ${error.message}`);
        return ErrorResponse(res, error.message);
    }
};

export const updateFormController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { formName, userType, pages } = req.body;

        const updateData = {
            formId: id,
            formName,
            userType,
            pages // 👈 replaces formFields
        };

        updateForm(updateData, (error: any, result: any) => {
            if (error) {
                loggerMsg("error", `Error in updateFormController: ${error.message}`);
                return ErrorResponse(res, error.message);
            }

            loggerMsg("info", "Form updated successfully");
            return successResponse(res, "Form updated successfully", result);
        });

    } catch (error: any) {
        loggerMsg("error", `Error in updateFormController: ${error.message}`);
        return ErrorResponse(res, error.message);
    }
};

/**
 * Delete Form
 */
export const deleteFormController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;

        deleteForm({ formId: id }, (error: any, result: any) => {
            if (error) {
                loggerMsg("error", `Error in deleteFormController: ${error.message}`);
                return ErrorResponse(res, error.message);
            }

            loggerMsg("info", "Form deleted successfully");
            return successResponse(res, "Form deleted successfully", result);
        });

    } catch (error: any) {
        loggerMsg("error", `Error in deleteFormController: ${error.message}`);
        return ErrorResponse(res, error.message);
    }
};

// cratea Page form model
export const addPageController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params; // formId
    const { pageName, description } = req.body;
    
    if (!pageName) {
      return ErrorResponse(res, "Page name is required");
    }

    const data = {
      formId: id,
      pageName,
      description
    };

    addPageToForm(data, (error: any, result: any) => {
      if (error) {
        loggerMsg("error", `Error in addPageController: ${error.message}`);
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Page added successfully to form");
      return successResponse(res, "Page added successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in addPageController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

export const exportFormController = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    exportFormPagesAsJson(id, (error: any, result: any) => {
      if (error) {
        loggerMsg("error", `Error in Export Controller: ${error.message}`);
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Page Export successfully to form");
      return successResponse(res, "Page Export successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in Export Form: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

// import conroll 
export const importFormController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;        
        const file = req.file;                
        if (!file) {
            return ErrorResponse(res, "JSON file is required for import");
        }        

        importFormPagesFromJson(id, file, (error: any, result: any) => {
            if (error) {
                loggerMsg("error", `Error in importFormController: ${error.message}`);
                return ErrorResponse(res, error.message);
            }

            loggerMsg("info", "Pages imported successfully to form");
            return successResponse(res, "Pages imported successfully", result);
        });
    } catch (error: any) {
        loggerMsg("error", `Error in importFormController: ${error.message}`);
        return ErrorResponse(res, error.message);
    }
};
