// models/exhibitorFormAsset.model.ts
import { loggerMsg } from "../../lib/logger";
import eventZoneSchema from "../schema/eventZone.schema";
import ExhibitorFormAsset from "../schema/exhibitorFormAsset.schema";
import exhibitorFormConfigurationSchema from "../schema/exhibitorFormConfiguration.schema";

// Get all form configurations with current allocations for an event
export const getExhibitorFormAssetList = async (
  callback: (error: Error | null, result?: any) => void,
  eventId: string,
  page: number = 1,
  limit: number = 10,
  search?: string,
) => {
  try {
    const skip = (page - 1) * limit;

    // Search query for form configurations
    const searchQuery: any = {};
    if (search) {
      searchQuery.$or = [
        { configName: { $regex: search, $options: "i" } },
        { configSlug: { $regex: search, $options: "i" } },
        { formNo: { $regex: search, $options: "i" } },
      ];
    }

    // Get all form configurations with pagination
    const formConfigs = await exhibitorFormConfigurationSchema
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalData = await exhibitorFormConfigurationSchema.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalData / limit);

    // Get existing allocations for this event with populated zones
    const existingAssets = await ExhibitorFormAsset.find({ eventId })
      .populate('exhibitorFormConfigurationId')
      .populate('zones.zoneId'); // Populate zone details

    // Create a map for quick lookup of existing allocations
    const assetMap = new Map();
    existingAssets.forEach(asset => {
      assetMap.set(
        asset.exhibitorFormConfigurationId._id.toString(), 
        asset
      );
    });

    // Combine form configs with their allocations
    const assetsWithAllocations = formConfigs.map((config: any) => {
      const existingAsset = assetMap.get(config._id.toString());
      
      // Transform zones to include zone names
      const zones = existingAsset?.zones ? existingAsset.zones.map((zone: any) => ({
        zoneId: zone.zoneId._id,
        zoneName: zone.zoneId.name, // Get name from populated zone
        quantity: zone.quantity
      })) : [];

      return {
        _id: existingAsset?._id || null,
        formConfiguration: config,
        zones: zones,
        eventId,
        exhibitorFormConfigurationId: config._id,
        createdAt: existingAsset?.createdAt || config.createdAt,
        updatedAt: existingAsset?.updatedAt || config.updatedAt,
      };
    });

    callback(null, {
      assets: assetsWithAllocations,
      pagination: {
        currentPage: page,
        totalPages,
        totalData,
        limit,
      },
    });
  } catch (error: any) {
    loggerMsg("error", `Error fetching exhibitor asset list: ${error}`);
    callback(error, null);
  }
};

// Create or update exhibitor asset allocation
export const upsertExhibitorFormAsset = async (
  data: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const { eventId, exhibitorFormConfigurationId, zones } = data;

    // Check if asset already exists
    const existingAsset = await ExhibitorFormAsset.findOne({
      eventId,
      exhibitorFormConfigurationId,
    });

    let result;
    if (existingAsset) {
      // Update existing asset
      result = await ExhibitorFormAsset.findByIdAndUpdate(
        existingAsset._id,
        { zones },
        { new: true }
      ).populate('exhibitorFormConfigurationId');
    } else {
      // Create new asset
      const newAsset = new ExhibitorFormAsset(data);
      result = await newAsset.save();
      await result.populate('exhibitorFormConfigurationId');
    }

    callback(null, { asset: result });
  } catch (error: any) {
    loggerMsg("error", `Error upserting exhibitor asset: ${error}`);
    callback(error, null);
  }
};

// Get specific exhibitor asset by form configuration and event
export const getExhibitorFormAssetByConfig = async (
  eventId: string,
  exhibitorFormConfigurationId: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const asset = await ExhibitorFormAsset.findOne({
      eventId,
      exhibitorFormConfigurationId,
    })
      .populate("exhibitorFormConfigurationId")
      .populate("zones.zoneId");

    callback(null, { asset });
  } catch (error: any) {
    loggerMsg("error", `Error fetching exhibitor asset: ${error}`);
    callback(error, null);
  }
};