import { loggerMsg } from "../../lib/logger";
import eBadgeSettingSchema, { IEBadgeSetting } from "../schema/eBadgeSetting.schema";

export const createEBadgeSetting = async (
  data: Partial<IEBadgeSetting>,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Check if same name already exists for same event
    const existingSetting = await eBadgeSettingSchema.findOne({
      name: data.name,
      eventId: data.eventId,
    });

    if (existingSetting)
      return callback(new Error("E-Badge setting with this name already exists for this event"));

    const newSetting = new eBadgeSettingSchema(data);
    const saved = await newSetting.save();

    callback(null, { setting: saved });
  } catch (error: any) {
    loggerMsg("error", `Error creating eBadgeSetting: ${error}`);
    callback(error, null);
  }
};

export const getAllEBadgeSettings = async (
  callback: (error: Error | null, result?: any) => void,
  page: number = 1,
  limit: number = 10,
  search?: string,
  eventId?: string
) => {
  try {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (eventId) query.eventId = eventId;
    if (search) query.name = { $regex: search, $options: "i" };

    const settings = await eBadgeSettingSchema
      .find(query)
      .populate("templateId", "name")
      .populate("ticketIds", "ticketName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalData = await eBadgeSettingSchema.countDocuments(query);

    callback(null, {
      settings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalData / limit),
        totalData,
        limit,
      },
    });
  } catch (error: any) {
    loggerMsg("error", `Error fetching eBadgeSettings: ${error}`);
    callback(error, null);
  }
};

export const getEBadgeSettingById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const setting = await eBadgeSettingSchema
      .findById(id)
      .populate("templateId", "name")
      .populate("ticketIds", "ticketName");

    if (!setting) return callback(new Error("E-Badge setting not found"));
    callback(null, { setting });
  } catch (error: any) {
    loggerMsg("error", `Error fetching eBadgeSetting by ID: ${error}`);
    callback(error, null);
  }
};

export const updateEBadgeSettingById = async (
  id: string,
  updateData: Partial<IEBadgeSetting>,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    if (updateData.name) {
      const existing = await eBadgeSettingSchema.findOne({
        _id: { $ne: id },
        name: updateData.name,
        eventId: updateData.eventId,
      });
      if (existing) return callback(new Error("Another setting with this name already exists"));
    }

    const updated = await eBadgeSettingSchema.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return callback(new Error("E-Badge setting not found"));

    callback(null, { setting: updated });
  } catch (error: any) {
    loggerMsg("error", `Error updating eBadgeSetting: ${error}`);
    callback(error, null);
  }
};

export const deleteEBadgeSettingById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const deleted = await eBadgeSettingSchema.findByIdAndDelete(id);
    if (!deleted) return callback(new Error("E-Badge setting not found"));
    callback(null, { deleted });
  } catch (error: any) {
    loggerMsg("error", `Error deleting eBadgeSetting: ${error}`);
    callback(error, null);
  }
};
