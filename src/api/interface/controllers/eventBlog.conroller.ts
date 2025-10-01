import { Request, Response } from "express";
import { Types } from 'mongoose';
import path from "path"
import fs from "fs";
import { env } from "process";
import { successResponse ,ErrorResponse } from "../../helper/apiResponse";
import { storeCompany ,companyList ,updateCompany,updateStatus} from "../../domain/models/company.model";
import BLogSchema from "../../domain/schema/eventblog.schema";
import { storeBlog , eventBlogdList , updateEventBlog , eventBlogdLocationList} from "../../domain/models/eventBlog.models";
interface FileWithBuffer extends Express.Multer.File {
buffer: Buffer;
}
  

export const getEventBlog = async (req: Request, res: Response) => {
    try {
        const { page = 1, pageSize = 10, searchQuery = "" } = req.query;
        eventBlogdList(req.body,
            parseInt(page as string),
            parseInt(pageSize as string),
            searchQuery as string, (error:any, result:any) => {
                if (error) {
                    return res.status(500).json({
                        code: "INTERNAL_SERVER_ERROR",
                        message: error instanceof Error ? error.message : "An unexpected error occurred."
                    });
                }
                return successResponse(res, 'success', 
                    result,
                )
            });
    } catch (error) {
       return  ErrorResponse(res,'An error occurred during user registration.')
    }
}

export const storeBlogController = async (req: Request, res: Response) => {
    try {

        if (!req.files || req.files.length === 0) {
           return res.status(400).send("No files uploaded.");
        }

        const files = req.files as FileWithBuffer[];

        files.forEach((file) => {
            const field_name = file.fieldname;
            const fileName = `${Date.now()}-${file.originalname}`;

            const savePath = path.join("uploads", fileName);

            fs.writeFileSync(savePath, file.buffer);

            req.body[field_name] = savePath;
        });

        storeBlog(req.body, (error: any, result: any) => {
            if (error) {
                return ErrorResponse(res, error.message);
            }

            return successResponse(res, "added blogs sucessfully!", []);
        });

    } catch (error) {
        return ErrorResponse(res, "An error occurred during add event.");
    }
}

export const eventBlogDetailsController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const blog = await BLogSchema.findById(id);
        if (!blog) {
            return ErrorResponse(res, "Blog not found")
        }
        const baseUrl = env.BASE_URL; 
        if(blog.blog_image){
            blog.blog_image = baseUrl +'/'+ blog.blog_image
        }
        return successResponse(res, 'Get Blog List',blog)
    } catch (error) {
        return  ErrorResponse(res,'An error occurred during get blog.')
    }
}

export const updateBlogController = async (req: Request, res: Response) => {
    try {
        const files = req.files as FileWithBuffer[];

        files.forEach((file) => {
            const field_name = file.fieldname;
            const fileName = `${Date.now()}-${file.originalname}`;

            const savePath = path.join("uploads", fileName);

            fs.writeFileSync(savePath, file.buffer);

            req.body[field_name] = savePath;
        });
        
        updateEventBlog(req.body, (error:any, result:any) => {
            if (error) {
                return ErrorResponse(res, "An unexpected error occurred.")
            }
            return successResponse(res,'success', result)
        });
       } catch (error) {
           return  ErrorResponse(res,'An error occurred during get blog.')
       }
 }

 export const locationWiseEventList = async (req: Request, res: Response) => {
    try {
       
        const { page = 1, pageSize = 10, searchQuery = "" } = req.query;
        const currentLocation = "surat";
        eventBlogdLocationList(req.body,
            parseInt(page as string),
            parseInt(pageSize as string),
            searchQuery as string, currentLocation as string, (error:any, result:any) => {
                if (error) {
                    return res.status(500).json({
                        code: "INTERNAL_SERVER_ERROR",
                        message: error instanceof Error ? error.message : "An unexpected error occurred."
                    });
                }
                return successResponse(res, 'success', 
                    result,
                )
            });
    } catch (error) {
       return  ErrorResponse(res,'An error occurred during user registration.')
    }
 }

 export const locationWiseBlogDetails = async (req: Request, res: Response) => {
    try {
        const currentLocation = req.body.location ? req.body.location : "";
        console.log(req.body);
        const { blog_slug } = req.body;

        if (!blog_slug) {
            return ErrorResponse(res, "Blog slug is required.");
        }

        const blog = await BLogSchema.findOne({ blog_slug: blog_slug });
        
        if (!blog) {
            return ErrorResponse(res, "Blog not found");
        }

        const baseUrl = env.BASE_URL; 
        if(blog.blog_image){
            blog.blog_image = baseUrl +'/'+ blog.blog_image
        }

        blog.description = blog.description?.replace(/\{LOCATION\}/g, currentLocation ? currentLocation : '') || ""

        return successResponse(res, "Get Blog List", blog);
    } catch (error) {
        console.error("Error fetching blog:", error);
        return ErrorResponse(res, "An error occurred while fetching the blog.");
    }
};

export const deleteEventBlogController = async (req: Request, res: Response) => {
    try {
        const { blog_ids } = req.body; 

        if (!blog_ids || !Array.isArray(blog_ids) || blog_ids.length === 0) {
            return ErrorResponse(res, "Please provide at least one valid company ID.");
        }

        const result = await BLogSchema.deleteMany({ _id: { $in: blog_ids } });

        if (result.deletedCount === 0) {
            return ErrorResponse(res, "No company found with the provided IDs.");
        }

        return successResponse(res, `Successfully deleted  company(ies).`,result.deletedCount);

    } catch (error) {
        return ErrorResponse(res, "An error occurred during event retrieval.");
    }
}




