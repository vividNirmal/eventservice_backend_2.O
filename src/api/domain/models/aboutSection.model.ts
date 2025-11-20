import { loggerMsg } from "../../lib/logger";
import AboutSectionSchema, { IAboutSection } from "../schema/aboutSection.schema";
import mongoose from "mongoose";

/**
 * Get about section by company ID
 */
export const getAboutSectionModel = async (
  companyId: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const aboutSection = await AboutSectionSchema.findOne({ companyId });
    callback(null, { aboutSection: aboutSection ? aboutSection.toObject() : null });
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
    companyId: string;
  }
) => {
  try {
    const { companyId, title, description } = aboutSectionData;

    // Single atomic operation for create/update
    const result = await AboutSectionSchema.findOneAndUpdate(
      { companyId },
      { title, description, companyId },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    loggerMsg("info", `About section saved: ${result._id}`);

    return {
      success: true,
      data: result.toObject(),
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