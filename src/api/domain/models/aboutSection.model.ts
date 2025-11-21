import { loggerMsg } from "../../lib/logger";
import { env } from "../../../infrastructure/env";
import AboutSectionSchema, { IAboutSection } from "../schema/aboutSection.schema";
import mongoose from "mongoose";

/**
 * Add image URL to about section object
 */
const addImageUrl = (aboutSectionObj: any) => {
  const baseUrl = env.BASE_URL;
  if (aboutSectionObj?.image) {
    aboutSectionObj.imageUrl = `${baseUrl}/uploads/${aboutSectionObj.image}`;
  }
  return aboutSectionObj;
};

/**
 * Get about section by company ID
 */
export const getAboutSectionModel = async (
  companyId: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const aboutSection = await AboutSectionSchema.findOne({ companyId });
    const aboutSectionData = aboutSection ? addImageUrl(aboutSection.toObject()) : null;
    callback(null, { aboutSection: aboutSectionData });
  } catch (error: any) {
    loggerMsg("error", `Error fetching about section by company ID: ${error}`);
    callback(error, null);
  }
};

/**
 * Create or update about section
 */
export const saveAboutSectionModel = async (
  aboutSectionData: {
    title: string;
    description: string;
    image?: string;
    companyId: string;
  }
) => {
  try {
    const { companyId, title, description, image } = aboutSectionData;

    // Prepare update data
    const updateData: any = {
      title,
      description,
      companyId
    };

    // Only update image if provided
    if (image) {
      updateData.image = image;
    }

    // Single atomic operation for create/update
    const result = await AboutSectionSchema.findOneAndUpdate(
      { companyId },
      updateData,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    const aboutSectionWithUrl = addImageUrl(result.toObject());
    loggerMsg("info", `About section saved: ${result._id}`);

    return {
      success: true,
      data: aboutSectionWithUrl,
      message: "About section saved successfully",
    };
  } catch (error: any) {
    loggerMsg("error", `Error saving about section: ${error.message}`);
    return {
      success: false,
      message: "Failed to save about section",
      error: error.message,
    };
  }
};