import { loggerMsg } from "../../lib/logger";
import { env } from "../../../infrastructure/env";
import PartnerSectionSchema, { IPartnerSection } from "../schema/partnerSection.schema";
import mongoose from "mongoose";

/**
 * Add image URLs to partners
 */
const addPartnerImageUrls = (partnerSection: any) => {
  const baseUrl = env.BASE_URL;
  if (partnerSection?.partners && Array.isArray(partnerSection.partners)) {
    partnerSection.partners = partnerSection.partners.map((partner: any) => {
      if (partner.image) {
        return {
          ...partner,
          imageUrl: `${baseUrl}/uploads/${partner.image}`,
        };
      }
      return partner;
    });
  }
  return partnerSection;
};

/**
 * Get partner section by company ID
 */
export const getPartnerSectionModel = async (
  companyId: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const partnerSection = await PartnerSectionSchema.findOne({ companyId });
    
    if (partnerSection) {
      const partnerSectionObj = partnerSection.toObject();
      const partnerSectionWithUrls = addPartnerImageUrls(partnerSectionObj);
      callback(null, { partnerSection: partnerSectionWithUrls });
    } else {
      callback(null, { partnerSection: null });
    }
  } catch (error: any) {
    loggerMsg("error", `Error fetching partner section by company ID: ${error}`);
    callback(error, null);
  }
};

/**
 * Create or update partner section
 */
export const savePartnerSectionModel = async (
  partnerSectionData: {
    title: string;
    partners: any[];
    companyId: string;
  }
) => {
  try {
    const { companyId, title, partners } = partnerSectionData;

    // Single atomic operation for create/update
    const result = await PartnerSectionSchema.findOneAndUpdate(
      { companyId },
      { 
        title, 
        partners: partners || [],
        companyId 
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    loggerMsg("info", `Partner section saved: ${result._id}`);

    const resultObj = result.toObject();
    const resultWithUrls = addPartnerImageUrls(resultObj);

    return {
      success: true,
      data: resultWithUrls,
      message: "Partner section saved successfully",
    };
  } catch (error: any) {
    loggerMsg("error", `Error saving partner section: ${error.message}`);
    return {
      success: false,
      message: "Failed to save partner section",
      error: error.message,
    };
  }
};