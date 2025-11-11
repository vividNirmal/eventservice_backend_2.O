import { loggerMsg } from "../../lib/logger";
import EventZoneSchema from "../schema/eventZone.schema";

// Create
export const createEventZoneModule = async (
  data: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Check uniqueness of name per event
    const existing = await EventZoneSchema.findOne({
      name: data.name,
      eventId: data.eventId,
    });

    if (existing) {
      return callback(
        new Error("This zone name already exists for this event")
      );
    }

    const zone = new EventZoneSchema(data);
    const saved = await zone.save();

    callback(null, { eventZone: saved });
  } catch (error: any) {
    loggerMsg("error", `Error creating EventZone: ${error}`);
    if (error.code === 11000) {
      return callback(
        new Error("This zone name already exists for this event")
      );
    }
    callback(error, null);
  }
};

// Get all with pagination & search
export const getAllEventZones = async (
  callback: (error: Error | null, result?: any) => void,
  page: number = 1,
  limit: number = 10,
  search?: string,
  eventId?: string,
  companyId?: string
) => {
  try {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (eventId) query.eventId = eventId;
    if (companyId) query.companyId = companyId;

    // Fetch zones sorted by creation date
    let zones = await EventZoneSchema.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter if search provided
    if (search) {
      const lowerSearch = search.toLowerCase();
      zones = zones.filter((z) => z.name.toLowerCase().includes(lowerSearch));
    }

    const total = await EventZoneSchema.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    callback(null, {
      zones,
      pagination: {
        currentPage: page,
        totalPages,
        totalData: total,
        limit,
      },
    });
  } catch (error: any) {
    loggerMsg("error", `Error fetching EventZones: ${error}`);
    callback(error, null);
  }
};

// Get by ID
export const getEventZoneById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const zone = await EventZoneSchema.findById(id);
    if (!zone) return callback(new Error("EventZone not found"), null);

    callback(null, { eventZone: zone });
  } catch (error: any) {
    loggerMsg("error", `Error fetching EventZone by ID: ${error}`);
    callback(error, null);
  }
};

// Update by ID
export const updateEventZoneById = async (
  id: string,
  updateData: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    if (updateData.name || updateData.eventId) {
      const existing = await EventZoneSchema.findOne({
        _id: { $ne: id },
        name: updateData.name,
        eventId: updateData.eventId,
      });
      if (existing) {
        return callback(
          new Error("This zone name already exists for this event")
        );
      }
    }

    const updated = await EventZoneSchema.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updated) return callback(new Error("EventZone not found"), null);

    callback(null, { eventZone: updated });
  } catch (error: any) {
    loggerMsg("error", `Error updating EventZone: ${error}`);
    if (error.code === 11000) {
      return callback(
        new Error("This zone name already exists for this event")
      );
    }
    callback(error, null);
  }
};

// Delete by ID
export const deleteEventZoneById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const deleted = await EventZoneSchema.findByIdAndDelete(id);
    if (!deleted) return callback(new Error("EventZone not found"), null);

    callback(null, { eventZone: deleted });
  } catch (error: any) {
    loggerMsg("error", `Error deleting EventZone: ${error}`);
    callback(error, null);
  }
};
