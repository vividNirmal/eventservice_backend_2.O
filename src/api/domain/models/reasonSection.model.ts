import { loggerMsg } from "../../lib/logger";
import { env } from "../../../infrastructure/env";
import ReasonSectionSchema, { IReasonSection } from "../schema/reasonSection.schema";
import mongoose from "mongoose";

/**
 * Add image URLs to reason section and info items
 */
const addImageUrls = (reasonSection: any) => {
  const baseUrl = env.BASE_URL;
  
  // Add main image URL
  if (reasonSection?.image) {
    reasonSection.imageUrl = `${baseUrl}/uploads/${reasonSection.image}`;
  }

  // Add info image URLs
  if (reasonSection?.info && Array.isArray(reasonSection.info)) {
    reasonSection.info = reasonSection.info.map((item: any) => {
      if (item.info_image) {
        return {
          ...item,
          imageUrl: `${baseUrl}/uploads/${item.info_image}`,
        };
      }
      return item;
    });
  }
  
  return reasonSection;
};

/**
 * Get reason section by company ID
 */
export const getReasonSectionModel = async (
  companyId: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const reasonSection = await ReasonSectionSchema.findOne({ companyId });
    
    if (reasonSection) {
      const reasonSectionObj = reasonSection.toObject();
      const reasonSectionWithUrls = addImageUrls(reasonSectionObj);
      callback(null, { reasonSection: reasonSectionWithUrls });
    } else {
      callback(null, { reasonSection: null });
    }
  } catch (error: any) {
    loggerMsg("error", `Error fetching reason section by company ID: ${error}`);
    callback(error, null);
  }
};

/**
 * Create or update reason section
 */
export const saveReasonSectionModel = async (
  reasonSectionData: {
    title: string;
    description?: string;
    image: string;
    info: any[];
    companyId: string;
  }
) => {
  try {
    const { companyId, title, description, image, info } = reasonSectionData;

    // Single atomic operation for create/update
    const result = await ReasonSectionSchema.findOneAndUpdate(
      { companyId },
      { 
        title, 
        description: description || "",
        image,
        info: info || [],
        companyId 
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    loggerMsg("info", `Reason section saved: ${result._id}`);

    const resultObj = result.toObject();
    const resultWithUrls = addImageUrls(resultObj);

    return {
      success: true,
      data: resultWithUrls,
      message: "Reason section saved successfully",
    };
  } catch (error: any) {
    loggerMsg("error", `Error saving reason section: ${error.message}`);
    return {
      success: false,
      message: "Failed to save reason section",
      error: error.message,
    };
  }
};