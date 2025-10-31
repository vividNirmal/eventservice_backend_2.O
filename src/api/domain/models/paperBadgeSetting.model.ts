import { loggerMsg } from "../../lib/logger";
import paperBadgeSettingSchema, { IPaperBadgeSetting } from "../schema/paperBadgeSetting.schema";

export const createPaperBadgeSetting = async (
  data: Partial<IPaperBadgeSetting>,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Check if same name already exists for same event
    const existingSetting = await paperBadgeSettingSchema.findOne({
      name: data.name,
      eventId: data.eventId,
    });

    if (existingSetting)
      return callback(new Error("Paper Badge setting with this name already exists for this event"));

    const newSetting = new paperBadgeSettingSchema(data);
    const saved = await newSetting.save();

    callback(null, { setting: saved });
  } catch (error: any) {
    loggerMsg("error", `Error creating paperBadgeSetting: ${error}`);
    callback(error, null);
  }
};

export const getAllPaperBadgeSettings = async (
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

    const settings = await paperBadgeSettingSchema
      .find(query)
      .populate("templateId", "name")
      .populate("ticketIds", "ticketName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalData = await paperBadgeSettingSchema.countDocuments(query);

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
    loggerMsg("error", `Error fetching paperBadgeSettings: ${error}`);
    callback(error, null);
  }
};

export const getPaperBadgeSettingById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const setting = await paperBadgeSettingSchema
      .findById(id)
      .populate("templateId", "name")
      .populate("ticketIds", "ticketName");

    if (!setting) return callback(new Error("Paper Badge setting not found"));
    callback(null, { setting });
  } catch (error: any) {
    loggerMsg("error", `Error fetching paperBadgeSetting by ID: ${error}`);
    callback(error, null);
  }
};

export const updatePaperBadgeSettingById = async (
  id: string,
  updateData: Partial<IPaperBadgeSetting>,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    if (updateData.name) {
      const existing = await paperBadgeSettingSchema.findOne({
        _id: { $ne: id },
        name: updateData.name,
        eventId: updateData.eventId,
      });
      if (existing) return callback(new Error("Another setting with this name already exists"));
    }

    const updated = await paperBadgeSettingSchema.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return callback(new Error("Paper Badge setting not found"));

    callback(null, { setting: updated });
  } catch (error: any) {
    loggerMsg("error", `Error updating paperBadgeSetting: ${error}`);
    callback(error, null);
  }
};

export const updatePaperBadgeSettingPropertiesById = async (
  id: string,
  updateData: {
    templateId?: any;
    fixedPosition?: boolean;
    paperSize?: string;
    fields?: any[];
    fieldProperties?: Record<string, any>;
  },
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Prepare clean update object
    const updateFields: any = {};

    if ("templateId" in updateData) {
      updateFields.templateId = updateData.templateId === "" ? null : updateData.templateId;
    }
    if ("fixedPosition" in updateData) {
      updateFields.fixedPosition = updateData.fixedPosition;
    }
    if (updateData.paperSize) updateFields.paperSize = updateData.paperSize;
    if (updateData.fields) updateFields.fields = updateData.fields;
    if (updateData.fieldProperties)
      updateFields.fieldProperties = updateData.fieldProperties;

    // Run update
    const updated = await paperBadgeSettingSchema.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updated) return callback(new Error("Paper Badge setting not found"));

    callback(null, { setting: updated });
  } catch (error: any) {
    loggerMsg("error", `Error updating paperBadgeSetting: ${error}`);
    callback(error, null);
  }
};


export const deletePaperBadgeSettingById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const deleted = await paperBadgeSettingSchema.findByIdAndDelete(id);
    if (!deleted) return callback(new Error("Paper Badge setting not found"));
    callback(null, { deleted });
  } catch (error: any) {
    loggerMsg("error", `Error deleting paperBadgeSetting: ${error}`);
    callback(error, null);
  }
};
