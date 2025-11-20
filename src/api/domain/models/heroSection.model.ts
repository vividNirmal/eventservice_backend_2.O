import { loggerMsg } from "../../lib/logger";
import { env } from "../../../infrastructure/env";
import HeroSectionSchema, { IHeroSection } from "../schema/heroSection.schema";
import mongoose from "mongoose";

const addImageUrl = (heroSectionObj: any) => {
  const baseUrl = env.BASE_URL;
  if (heroSectionObj?.image) {
    heroSectionObj.imageUrl = `${baseUrl}/uploads/${heroSectionObj.image}`;
  }
  return heroSectionObj;
};

/**
 * Create hero section
 */
export const createHeroSection = async (
  heroSectionData: Partial<IHeroSection>,
  companyId: mongoose.Types.ObjectId
) => {
  try {
    // Check if hero section with same title already exists for this company
    const existing = await HeroSectionSchema.findOne({
      title: heroSectionData.title,
      companyId,
    });

    if (existing) {
      return {
        success: false,
        message: "Hero section with this title already exists",
      };
    }

    const newHeroSection = new HeroSectionSchema({
      ...heroSectionData,
      companyId,
    });

    const saved = await newHeroSection.save();

    const heroSectionWithUrl = addImageUrl(saved.toObject());
    loggerMsg("info", `Hero section created: ${saved._id}`);

    return {
      success: true,
      data: heroSectionWithUrl,
      message: "Hero section created successfully",
    };
  } catch (error: any) {
    loggerMsg("error", `Error creating hero section: ${error.message}`);
    return {
      success: false,
      message: "Failed to create hero section",
      error: error.message,
    };
  }
};

/**
 * Update hero section
 */
export const updateHeroSection = async (
  id: mongoose.Types.ObjectId,
  updateData: Partial<IHeroSection>,
  companyId: mongoose.Types.ObjectId
) => {
  try {
    if (updateData.title) {
      const existing = await HeroSectionSchema.findOne({
        _id: { $ne: id },
        title: updateData.title,
        companyId,
      });
      if (existing) {
        return {
          success: false,
          message: "Hero section with this title already exists",
        };
      }
    }

    const updated = await HeroSectionSchema.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return {
        success: false,
        message: "Hero section not found",
      };
    }

    const heroSectionWithUrl = addImageUrl(updated.toObject());
    loggerMsg("info", `Hero section updated: ${id}`);

    return {
      success: true,
      data: heroSectionWithUrl,
      message: "Hero section updated successfully",
    };
  } catch (error: any) {
    loggerMsg("error", `Error updating hero section: ${error.message}`);
    return {
      success: false,
      message: "Failed to update hero section",
      error: error.message,
    };
  }
};

/**
 * Get all hero sections with pagination and search
 */
export const getAllHeroSections = async (
  callback: (error: Error | null, result?: any) => void,
  page: number = 1,
  limit: number = 10,
  search?: string,
  companyId?: string
) => {
  try {
    const skip = (page - 1) * limit;
    const query: any = {};

    // Add search condition
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    // Add company filter
    if (companyId) {
      query.companyId = companyId;
    }

    const heroSections = await HeroSectionSchema.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalData = await HeroSectionSchema.countDocuments(query);
    const heroSectionsWithUrls = heroSections.map(section => addImageUrl(section.toObject()));

    callback(null, {
      heroSections: heroSectionsWithUrls,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalData / limit),
        totalData,
        limit,
      },
    });
  } catch (error: any) {
    loggerMsg("error", `Error fetching hero sections: ${error}`);
    callback(error, null);
  }
};

/**
 * Get hero section by ID
 */
export const getHeroSectionById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const heroSection = await HeroSectionSchema.findById(id);
    if (!heroSection) return callback(new Error("Hero section not found"));
    callback(null, { heroSection: addImageUrl(heroSection.toObject()) });
  } catch (error: any) {
    loggerMsg("error", `Error fetching hero section by ID: ${error}`);
    callback(error, null);
  }
};

/**
 * Delete hero section by ID
 */
export const deleteHeroSectionById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const deleted = await HeroSectionSchema.findByIdAndDelete(id);
    if (!deleted) return callback(new Error("Hero section not found"));
    callback(null, { heroSection: addImageUrl(deleted.toObject()) });
  } catch (error: any) {
    loggerMsg("error", `Error deleting hero section: ${error}`);
    callback(error, null);
  }
};