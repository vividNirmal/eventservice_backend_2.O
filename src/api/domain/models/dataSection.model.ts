import { loggerMsg } from "../../lib/logger";
import { env } from "../../../infrastructure/env";
import DataSectionSchema, { IDataSection } from "../schema/dataSection.schema";
import mongoose from "mongoose";

/**
 * Add image URLs to badges
 */
const addBadgeImageUrls = (dataSection: any) => {
  const baseUrl = env.BASE_URL;
  if (dataSection?.badges && Array.isArray(dataSection.badges)) {
    dataSection.badges = dataSection.badges.map((badge: any) => {
      if (badge.image) {
        return {
          ...badge,
          imageUrl: `${baseUrl}/uploads/${badge.image}`,
        };
      }
      return badge;
    });
  }
  return dataSection;
};

/**
 * Get data section by company ID
 */
export const getDataSectionModel = async (
  companyId: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const dataSection = await DataSectionSchema.findOne({ companyId });
    
    if (dataSection) {
      const dataSectionObj = dataSection.toObject();
      const dataSectionWithUrls = addBadgeImageUrls(dataSectionObj);
      callback(null, { dataSection: dataSectionWithUrls });
    } else {
      callback(null, { dataSection: null });
    }
  } catch (error: any) {
    loggerMsg("error", `Error fetching data section by company ID: ${error}`);
    callback(error, null);
  }
};

/**
 * Create or update data section
 */
export const saveDataSectionModel = async (
  dataSectionData: {
    title: string;
    badges: any[];
    companyId: string;
  }
) => {
  try {
    const { companyId, title, badges } = dataSectionData;

    // Single atomic operation for create/update
    const result = await DataSectionSchema.findOneAndUpdate(
      { companyId },
      { 
        title, 
        badges: badges || [],
        companyId 
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    loggerMsg("info", `Data section saved: ${result._id}`);

    const resultObj = result.toObject();
    const resultWithUrls = addBadgeImageUrls(resultObj);

    return {
      success: true,
      data: resultWithUrls,
      message: "Data section saved successfully",
    };
  } catch (error: any) {
    loggerMsg("error", `Error saving data section: ${error.message}`);
    return {
      success: false,
      message: "Failed to save data section",
      error: error.message,
    };
  }
};