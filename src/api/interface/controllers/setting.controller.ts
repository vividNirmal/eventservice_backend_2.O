import { Request, Response } from "express";
import { successResponse ,ErrorResponse } from "../../helper/apiResponse";
import SettingSchema from "../../domain/schema/setting.schema";
import { env } from "process";

interface FileWithBuffer extends Express.Multer.File {
buffer: Buffer;
}

  export const getSetting = async (req: Request, res: Response) => {
    try {

        const baseUrl = env.BASE_URL+"/";

        const setting = await SettingSchema.findOne().select('+buttons').lean();

        const button_settings = setting?.buttons.map(button => ({
            ...button,
            icon: `${baseUrl}${button.icon.replace(/^\//, "")}` 
        }));

        return successResponse(res, 'Get Scanner page button details', {
            button_settings
        });
        
    } catch (error) {
        console.log(error);
        ErrorResponse(res, 'An error occurred during event retrieval.');
    }
};

export const updateSetting = async (req: Request, res: Response) => {
    try {

        console.log(req);

        const { buttons } = req.body; 

        const baseUrl = process.env.BASE_URL || "";

        const setting = await SettingSchema.findOne();
        console.log(setting);

        if (!setting) {
            return ErrorResponse(res, "Settings not found");
        }

        console.log(buttons);

        return successResponse(res, "Update button details successfully", { buttons });

    } catch (error) {
        console.error("Update Setting Error:", error);
        return ErrorResponse(res, "An error occurred while updating button settings.");
    }
};

