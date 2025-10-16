import { loggerMsg } from "../../lib/logger";
import eBadgeTemplateSchema, { IEBadgeTemplate } from "../schema/eBadgeTemplate.schema";

export const createEBadgeTemplate = async (
  data: Partial<IEBadgeTemplate>,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const existingTemplate = await eBadgeTemplateSchema.findOne({ name: data.name });
    if (existingTemplate) return callback(new Error("Template with this name already exists"));

    const template = new eBadgeTemplateSchema(data);
    const savedTemplate = await template.save();
    callback(null, { template: savedTemplate });
  } catch (error: any) {
    loggerMsg("error", `Error creating E-Badge template: ${error}`);
    if (error.code === 11000) return callback(new Error("Template with this name already exists"));
    callback(error, null);
  }
};

export const getAllEBadgeTemplates = async (
  callback: (error: Error | null, result?: any) => void,
  page: number = 1,
  limit: number = 10,
  search?: string
) => {
  try {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (search) query.name = { $regex: search, $options: "i" };

    const templates = await eBadgeTemplateSchema
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalData = await eBadgeTemplateSchema.countDocuments(query);
    callback(null, {
      templates,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalData / limit),
        totalData,
        limit,
      },
    });
  } catch (error: any) {
    loggerMsg("error", `Error fetching E-Badge templates: ${error}`);
    callback(error, null);
  }
};

export const getEBadgeTemplateById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const template = await eBadgeTemplateSchema.findById(id);
    if (!template) return callback(new Error("Template not found"));
    callback(null, { template });
  } catch (error: any) {
    loggerMsg("error", `Error fetching template by ID: ${error}`);
    callback(error, null);
  }
};

export const updateEBadgeTemplateById = async (
  id: string,
  updateData: Partial<IEBadgeTemplate>,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    if (updateData.name) {
      const existing = await eBadgeTemplateSchema.findOne({ _id: { $ne: id }, name: updateData.name });
      if (existing) return callback(new Error("Template with this name already exists"));
    }

    const updated = await eBadgeTemplateSchema.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return callback(new Error("Template not found"));
    callback(null, { template: updated });
  } catch (error: any) {
    loggerMsg("error", `Error updating template: ${error}`);
    if (error.code === 11000) return callback(new Error("Template with this name already exists"));
    callback(error, null);
  }
};

export const deleteEBadgeTemplateById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const deleted = await eBadgeTemplateSchema.findByIdAndDelete(id);
    if (!deleted) return callback(new Error("Template not found"));
    callback(null, { template: deleted });
  } catch (error: any) {
    loggerMsg("error", `Error deleting template: ${error}`);
    callback(error, null);
  }
};
