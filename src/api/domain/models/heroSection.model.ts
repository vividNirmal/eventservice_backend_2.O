import { loggerMsg } from "../../lib/logger";
import { env } from "../../../infrastructure/env";
import HeroSectionSchema, { IHeroSection, IHero } from "../schema/heroSection.schema";
import mongoose from "mongoose";

/**
 * Add image URLs to hero items
 */
const addHeroImageUrls = (heroSection: any) => {
  const baseUrl = env.BASE_URL;
  if (heroSection?.hero && Array.isArray(heroSection.hero)) {
    heroSection.hero = heroSection.hero.map((hero: any) => {
      if (hero.image) {
        return {
          ...hero,
          imageUrl: `${baseUrl}/uploads/${hero.image}`,
        };
      }
      return hero;
    });
  }
  return heroSection;
};

/**
 * Get hero section by company ID
 */
export const getHeroSectionModel = async (
  companyId: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const heroSection = await HeroSectionSchema.findOne({ companyId });
    
    if (heroSection) {
      const heroSectionObj = heroSection.toObject();
      const heroSectionWithUrls = addHeroImageUrls(heroSectionObj);
      callback(null, { heroSection: heroSectionWithUrls });
    } else {
      callback(null, { heroSection: null });
    }
  } catch (error: any) {
    loggerMsg("error", `Error fetching hero section by company ID: ${error}`);
    callback(error, null);
  }
};

/**
 * Create or update hero section
 */
export const saveHeroSectionModel = async (
  heroSectionData: {
    hero: IHero[];
    companyId: string;
  }
) => {
  try {
    const { companyId, hero } = heroSectionData;

    // Single atomic operation for create/update
    const result = await HeroSectionSchema.findOneAndUpdate(
      { companyId },
      { 
        hero: hero || [],
        companyId 
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    loggerMsg("info", `Hero section saved: ${result._id}`);

    const resultObj = result.toObject();
    const resultWithUrls = addHeroImageUrls(resultObj);

    return {
      success: true,
      data: resultWithUrls,
      message: "Hero section saved successfully",
    };
  } catch (error: any) {
    loggerMsg("error", `Error saving hero section: ${error.message}`);
    return {
      success: false,
      message: "Failed to save hero section",
      error: error.message,
    };
  }
};