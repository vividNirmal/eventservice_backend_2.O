import { loggerMsg } from "../../lib/logger";
import BadgeCategorySchema, {
  IBadgeCategory,
} from "../schema/badgeCategory.schema";

export const createBadgeCategory = async (
  data: Partial<IBadgeCategory>,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const existingCategory = await BadgeCategorySchema.findOne({
      name: data.name,
      eventId: data.eventId,
    });
    if (existingCategory)
      return callback(new Error("Category with this name already exists"));

    const category = new BadgeCategorySchema(data);
    const savedCategory = await category.save();
    callback(null, { category: savedCategory });
  } catch (error: any) {
    loggerMsg("error", `Error creating Badge Category: ${error}`);
    callback(error, null);
  }
};

export const getAllBadgeCategories = async (
  callback: (error: Error | null, result?: any) => void,
  page: number = 1,
  limit: number = 10,
  search?: string
) => {
  try {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (search) query.name = { $regex: search, $options: "i" };

    const categories = await BadgeCategorySchema.find(query)
      .sort({ priority: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalData = await BadgeCategorySchema.countDocuments(query);
    callback(null, {
      categories,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalData / limit),
        totalData,
        limit,
      },
    });
  } catch (error: any) {
    loggerMsg("error", `Error fetching Badge Categories: ${error}`);
    callback(error, null);
  }
};

export const getBadgeCategoryById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const category = await BadgeCategorySchema.findById(id);
    if (!category) return callback(new Error("Category not found"));
    callback(null, { category });
  } catch (error: any) {
    loggerMsg("error", `Error fetching category by ID: ${error}`);
    callback(error, null);
  }
};

export const getBadgeCategoryByEventId = async (
  eventId: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const categories = await BadgeCategorySchema.find({ eventId }).sort({
      priority: 1,
    });
    if (!categories || categories.length === 0)
      return callback(new Error("No categories found"));
    callback(null, { categories });
  } catch (error: any) {
    loggerMsg("error", `Error fetching categories by event ID: ${error}`);
    callback(error, null);
  }
};

export const updateBadgeCategoryById = async (
  id: string,
  updateData: Partial<IBadgeCategory>,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    if (updateData.name) {
      const existing = await BadgeCategorySchema.findOne({
        _id: { $ne: id },
        name: updateData.name,
        eventId: updateData.eventId,
      });
      if (existing)
        return callback(new Error("Category with this name already exists"));
    }

    const updated = await BadgeCategorySchema.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    if (!updated) return callback(new Error("Category not found"));
    callback(null, { category: updated });
  } catch (error: any) {
    loggerMsg("error", `Error updating category: ${error}`);
    callback(error, null);
  }
};

export const deleteBadgeCategoryById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const deleted = await BadgeCategorySchema.findByIdAndDelete(id);
    if (!deleted) return callback(new Error("Category not found"));
    callback(null, { category: deleted });
  } catch (error: any) {
    loggerMsg("error", `Error deleting category: ${error}`);
    callback(error, null);
  }
};
