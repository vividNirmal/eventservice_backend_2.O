import { loggerMsg } from "../../lib/logger";
import { env } from "../../../infrastructure/env";
import EventImagesSchema, { IEventImages } from "../schema/eventImages"
import mongoose from "mongoose";

const addImageUrl = (imageObj: any) => {
  const baseUrl = env.BASE_URL;
  if (imageObj?.image) {
    imageObj.imageUrl = `${baseUrl}/uploads/${imageObj.image}`;
  }
  return imageObj;
};

/**
 * Create event image
 */
export const createEventImage = async (
  eventImageData: Partial<IEventImages>,
  companyId: mongoose.Types.ObjectId,
  eventId: mongoose.Types.ObjectId
) => {
  try {
    const existing = await EventImagesSchema.findOne({
      name: eventImageData.name,
      eventId,
    });

    if (existing) {
      return {
        success: false,
        message: "Event image with this name already exists",
      };
    }

    const newImage = new EventImagesSchema({
      ...eventImageData,
      companyId,
      eventId,
    });

    const saved = await newImage.save();

    const imageWithUrl = addImageUrl(saved.toObject());
    loggerMsg("info", `Event image created: ${saved._id}`);

    return {
      success: true,
      data: imageWithUrl,
      message: "Event image created successfully",
    };
  } catch (error: any) {
    loggerMsg("error", `Error creating event image: ${error.message}`);
    return {
      success: false,
      message: "Failed to create event image",
      error: error.message,
    };
  }
};

/**
 * Update event image
 */
export const updateEventImage = async (
  id: mongoose.Types.ObjectId,
  updateData: Partial<IEventImages>,
  companyId: mongoose.Types.ObjectId
) => {
  try {
    if (updateData.name) {
      const existing = await EventImagesSchema.findOne({
        _id: { $ne: id },
        name: updateData.name,
        eventId: updateData.eventId,
      });
      if (existing) {
        return {
          success: false,
          message: "Event image with this name already exists",
        };
      }
    }

    const updated = await EventImagesSchema.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return {
        success: false,
        message: "Event image not found",
      };
    }

    const imageWithUrl = addImageUrl(updated.toObject());
    loggerMsg("info", `Event image updated: ${id}`);

    return {
      success: true,
      data: imageWithUrl,
      message: "Event image updated successfully",
    };
  } catch (error: any) {
    loggerMsg("error", `Error updating event image: ${error.message}`);
    return {
      success: false,
      message: "Failed to update event image",
      error: error.message,
    };
  }
};

export const getAllEventImages = async (
  callback: (error: Error | null, result?: any) => void,
  page: number = 1,
  limit: number = 10,
  search?: string,
  eventId?: string
) => {
  try {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (search) query.name = { $regex: search, $options: "i" };
    if (eventId) query.eventId = eventId;

    const images = await EventImagesSchema.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalData = await EventImagesSchema.countDocuments(query);
    const imagesWithUrls = images.map(img => addImageUrl(img.toObject()));

    callback(null, {
      eventImages: imagesWithUrls,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalData / limit),
        totalData,
        limit,
      },
    });
  } catch (error: any) {
    loggerMsg("error", `Error fetching event images: ${error}`);
    callback(error, null);
  }
};

export const getEventImageById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const image = await EventImagesSchema.findById(id);
    if (!image) return callback(new Error("Event image not found"));
    callback(null, { eventImage: addImageUrl(image.toObject()) });
  } catch (error: any) {
    loggerMsg("error", `Error fetching event image by ID: ${error}`);
    callback(error, null);
  }
};

export const deleteEventImageById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const deleted = await EventImagesSchema.findByIdAndDelete(id);
    if (!deleted) return callback(new Error("Event image not found"));
    callback(null, { eventImage: addImageUrl(deleted.toObject()) });
  } catch (error: any) {
    loggerMsg("error", `Error deleting event image: ${error}`);
    callback(error, null);
  }
};
