import { Request, Response } from "express";
import deviceConfigurationSchema from "../../domain/schema/deviceConfiguration.schema";
import scannerMachineSchema from "../../domain/schema/scannerMachine.schema";

// Create device configuration
export const createDeviceConfiguration = async (req: Request, res: Response) => {
    try {
        const {
            scanner_machine_id,
            company_id,
            event_id,
            entry_mode,
            device_key,
            device_type,
            scanner_name,
            scanner_unique_id,
            location_name,
            check_in_area,
            check_in_by,
            device_access,
            badge_category,
            comment
        } = req.body;

        // Check if scanner machine exists
        const scannerMachine = await scannerMachineSchema.findById(scanner_machine_id);
        if (!scannerMachine) {
            return res.status(404).json({
                status: 0,
                message: "Scanner machine not found"
            });
        }

        // Check if configuration already exists for this device key, company, and event
        const existingConfig = await deviceConfigurationSchema.findOne({
            company_id,
            event_id,
            device_key
        });

        if (existingConfig) {
            return res.status(400).json({
                status: 0,
                message: "Configuration already exists for this device in this event"
            });
        }

        // Create new configuration
        const newConfiguration = new deviceConfigurationSchema({
            scanner_machine_id,
            company_id,
            event_id,
            entry_mode,
            device_key,
            device_type,
            scanner_name,
            scanner_unique_id,
            location_name,
            check_in_area,
            check_in_by,
            device_access,
            badge_category,
            comment
        });

        const savedConfiguration = await newConfiguration.save();

        return res.status(201).json({
            status: 1,
            message: "Device configuration created successfully",
            data: savedConfiguration
        });
    } catch (error) {
        console.error("Error creating device configuration:", error);
        return res.status(500).json({
            status: 0,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// Update device configuration
export const updateDeviceConfiguration = async (req: Request, res: Response) => {
    try {
        const { id, ...updateData } = req.body;

        const configuration = await deviceConfigurationSchema.findById(id);
        if (!configuration) {
            return res.status(404).json({
                status: 0,
                message: "Device configuration not found"
            });
        }

        // If device_key is being updated, check for duplicates
        if (updateData.device_key && updateData.device_key !== configuration.device_key) {
            const existingConfig = await deviceConfigurationSchema.findOne({
                company_id: configuration.company_id,
                event_id: configuration.event_id,
                device_key: updateData.device_key,
                _id: { $ne: id }
            });

            if (existingConfig) {
                return res.status(400).json({
                    status: 0,
                    message: "Configuration already exists for this device in this event"
                });
            }
        }

        const updatedConfiguration = await deviceConfigurationSchema.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        return res.status(200).json({
            status: 1,
            message: "Device configuration updated successfully",
            data: updatedConfiguration
        });
    } catch (error) {
        console.error("Error updating device configuration:", error);
        return res.status(500).json({
            status: 0,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// Delete device configuration
export const deleteDeviceConfiguration = async (req: Request, res: Response) => {
    try {
        const { id } = req.body;

        const configuration = await deviceConfigurationSchema.findById(id);
        if (!configuration) {
            return res.status(404).json({
                status: 0,
                message: "Device configuration not found"
            });
        }

        await deviceConfigurationSchema.findByIdAndDelete(id);

        return res.status(200).json({
            status: 1,
            message: "Device configuration deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting device configuration:", error);
        return res.status(500).json({
            status: 0,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// Get device configurations by company and event with pagination
export const getDeviceConfigurationsByCompany = async (req: Request, res: Response) => {
    try {
        const { company_id, event_id } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const searchQuery = (req.query.searchQuery as string) || "";

        const skip = (page - 1) * pageSize;

        // Build search filter
        const searchFilter: any = {
            company_id,
            event_id,
            status: "1"
        };

        if (searchQuery) {
            searchFilter.$or = [
                { location_name: { $regex: searchQuery, $options: "i" } },
                { check_in_area: { $regex: searchQuery, $options: "i" } },
                { badge_category: { $regex: searchQuery, $options: "i" } },
                { device_access: { $regex: searchQuery, $options: "i" } }
            ];
        }

        // Get configurations with scanner machine details
        const configurations = await deviceConfigurationSchema.aggregate([
            { $match: searchFilter },
            {
                $lookup: {
                    from: "scannermachines",
                    localField: "scanner_machine_id",
                    foreignField: "_id",
                    as: "scanner_machine"
                }
            },
            {
                $unwind: {
                    path: "$scanner_machine",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    device_name: "$scanner_machine.scanner_name"
                }
            },
            { $skip: skip },
            { $limit: pageSize },
            { $sort: { createdAt: -1 } }
        ]);

        // Get total count for pagination
        const totalConfigurations = await deviceConfigurationSchema.countDocuments(searchFilter);
        const totalPages = Math.ceil(totalConfigurations / pageSize);

        return res.status(200).json({
            status: 1,
            message: "Device configurations retrieved successfully",
            data: {
                configurations,
                totalUsers: totalConfigurations,
                totalPages,
                currentPage: page,
                pageSize
            }
        });
    } catch (error) {
        console.error("Error fetching device configurations:", error);
        return res.status(500).json({
            status: 0,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// Get single device configuration by ID
export const getDeviceConfigurationById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const configuration = await deviceConfigurationSchema.findById(id)
            .populate('scanner_machine_id', 'scanner_name device_key device_type');

        if (!configuration) {
            return res.status(404).json({
                status: 0,
                message: "Device configuration not found"
            });
        }

        return res.status(200).json({
            status: 1,
            message: "Device configuration retrieved successfully",
            data: configuration
        });
    } catch (error) {
        console.error("Error fetching device configuration:", error);
        return res.status(500).json({
            status: 0,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};