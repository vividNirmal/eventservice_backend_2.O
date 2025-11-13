import { Request, Response } from "express";
import { Types } from "mongoose";
import { successResponse, ErrorResponse } from "../../helper/apiResponse";
import {
  storeCompany,
  companyList,
  updateCompany,
  updateStatus,
  updateCompanyLogoModel,
  getCompanyImagesModel,
} from "../../domain/models/company.model";
import companySchema from "../../domain/schema/company.schema";
import path from "path";
import fs from "fs";
import { env } from "process";
interface FileWithBuffer extends Express.Multer.File {
  buffer: Buffer;
}

export const storeCompanyController = async (req: Request, res: Response) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded.");
    }
    console.log(req.files.length);
    const files = req.files as FileWithBuffer[];

    files.forEach((file) => {
      const field_name = file.fieldname;
      const fileName = `${Date.now()}-${file.originalname}`;

      const savePath = path.join("uploads", fileName);

      fs.writeFileSync(savePath, file.buffer);

      req.body[field_name] = savePath;
    });

    storeCompany(req.body, (error: any, result: any) => {
      if (error) {
        return ErrorResponse(res, error.message);
      }

      return successResponse(res, "Get Admin Company List", { result });
    });
  } catch (error) {
    return ErrorResponse(res, "An error occurred during event retrieval.");
  }
};

export const updateCompanyStatus = async (req: Request, res: Response) => {
  try {
    updateStatus(req.body, (error: any, result: any) => {
      if (error) {
        return ErrorResponse(res, error.message);
      }

      return successResponse(res, "Status Updated", { result });
    });
  } catch (error) {
    return ErrorResponse(res, "An error occurred during event retrieval.");
  }
};

export const updateCompanyController = async (req: Request, res: Response) => {
  try {
    const { company_id } = req.params;

    if (!company_id) {
      return ErrorResponse(res, "Company ID is required.");
    }

    const files = req.files as FileWithBuffer[];

    files.forEach((file) => {
      const field_name = file.fieldname;
      const fileName = `${Date.now()}-${file.originalname}`;

      const savePath = path.join("uploads", fileName);

      fs.writeFileSync(savePath, file.buffer);

      req.body[field_name] = savePath;
    });

    updateCompany(company_id, req.body, (error: any, result: any) => {
      if (error) {
        return ErrorResponse(res, error.message);
      }

      return successResponse(res, "Update Company Details Successfully", {
        result,
      });
    });
  } catch (error) {
    return ErrorResponse(res, "An error occurred during event retrieval.");
  }
};

export const updateCompanyLogo = async (req: Request, res: Response) => {
  try {
    const { company_id } = req.body;
    const files = req.files as Express.Multer.File[];
    const companyData = req.body;
    // Handle uploaded files
    if (files && Array.isArray(files)) {
      files.forEach((file) => {
        if (file.fieldname === "logo") {
          companyData.logo = `${(file as any).uploadFolder}/${
            file.filename
          }`;
        } 
        if (file.fieldname === "attandess_dashboard_banner") {
          companyData.attandess_dashboard_banner = `${(file as any).uploadFolder}/${
            file.filename
          }`;
        }
         if (file.fieldname === "exhibitor_dashboard_banner") {
          companyData.exhibitor_dashboard_banner = `${(file as any).uploadFolder}/${
            file.filename
          }`;
        }
      });
    }

    if (!company_id) {
      return ErrorResponse(res, "Company ID is required.");
    }
    updateCompanyLogoModel(company_id, req.body, (error: any, result: any) => {
      if (error) {
        return ErrorResponse(res, error.message);
      }

      return successResponse(res, "Update Company Details Successfully", {
        result,
      });
    });
  } catch (error) {
    return ErrorResponse(res, "An error occurred during event retrieval.");
  }
};

export const getCompanyImages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return ErrorResponse(res, "Company ID is required.");
    }

    getCompanyImagesModel(id, (error: any, result: any) => {
      if (error) {
        return ErrorResponse(res, error.message);
      }

      return successResponse(res, "Company images retrieved successfully", {
        images: result.images
      });
    });
  } catch (error) {
    console.error("Error in getCompanyImages:", error);
    return ErrorResponse(res, "An error occurred while fetching company images.");
  }
};

export const getCompanyDetails = async (req: Request, res: Response) => {
  try {
    const { company_id } = req.params;
    if (!company_id) {
      return ErrorResponse(res, "Company ID is required.");
    }
    const company = await companySchema.findById(company_id);

    if (!company) {
      return ErrorResponse(res, "Company not found.");
    }

    const baseUrl = env.BASE_URL;
    if (company.logo) {
      company.logo = baseUrl + "/" + company.logo;
    }
    return successResponse(res, "Get Company details", { company });
  } catch (error) {
    return ErrorResponse(res, "An error occurred during event retrieval.");
  }
};

export const getCompany = async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 10, searchQuery = "" } = req.query;
    companyList(
      req.body,
      parseInt(page as string),
      parseInt(pageSize as string),
      searchQuery as string,
      (error: any, result: any) => {
        if (error) {
          return res.status(500).json({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred.",
          });
        }
        return successResponse(res, "Get Company List List", result);
      }
    );
  } catch (error) {
    return ErrorResponse(res, "An error occurred during event retrieval.");
  }
};

export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const { company_ids } = req.body;

    if (
      !company_ids ||
      !Array.isArray(company_ids) ||
      company_ids.length === 0
    ) {
      return ErrorResponse(
        res,
        "Please provide at least one valid company ID."
      );
    }

    const result = await companySchema.deleteMany({
      _id: { $in: company_ids },
    });

    if (result.deletedCount === 0) {
      return ErrorResponse(res, "No company found with the provided IDs.");
    }

    return successResponse(
      res,
      `Successfully deleted  company(ies).`,
      result.deletedCount
    );
  } catch (error) {
    return ErrorResponse(res, "An error occurred during event retrieval.");
  }
};
