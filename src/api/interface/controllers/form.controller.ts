import { Request, Response } from "express";
import { loggerMsg } from "../../lib/logger";
import { successResponse, ErrorResponse } from "../../helper/apiResponse";
import { 
    getAllForms, 
    getFormById, 
    createForm, 
    updateForm, 
    deleteForm 
} from "../../domain/models/form.model";

interface AuthenticatedRequest extends Request {
    user?: {
        user_id: string;
        company_id: string;
    };
}

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

export const createFormController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { formName, userType, formFields, companyId, eventId} = req.body;

        const formData = {
            formName,
            userType,
            formFields: formFields || [],
            companyId: companyId || req.user?.company_id || null,
            eventId : eventId || null
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
        const { formName, userType, formFields } = req.body;

        console.log('Update form request:', { id, body: req.body });

        const updateData = {
            formId: id,
            formName,
            userType,
            formFields
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
