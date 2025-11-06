import { Request, Response } from 'express';
import {
  createEventCompanyTeamMember,
  updateEventCompanyTeamMember,
  getAllEventCompanyTeamMembers,
  getEventCompanyTeamMemberById,
  deleteEventCompanyTeamMemberById,
  getTeamMembersCountByOwnership,
} from "../../domain/models/eventCompanyTeam.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";
import mongoose from 'mongoose';

/**
 * Create new event company team member
 */
export const createEventCompanyTeamController = async (req: Request, res: Response) => {
  try {
    const eventUserId = req.body.eventUser;
    const teamMemberData = req.body;
    const files = req.files as Express.Multer.File[];

    // Validate eventUser ID
    if (!eventUserId || !mongoose.Types.ObjectId.isValid(eventUserId)) {
      return res.status(400).json({
        status: 0,
        message: "Valid Event User ID is required",
      });
    }

    // Handle uploaded files
    if (files && Array.isArray(files)) {
      files.forEach((file) => {
        if (file.fieldname === "profile_picture") {
          teamMemberData.profile_picture = `${(file as any).uploadFolder}/${file.filename}`;
        } else if (file.fieldname === "pan_card") {
          teamMemberData.pan_card = `${(file as any).uploadFolder}/${file.filename}`;
        }
      });
    }

    const result = await createEventCompanyTeamMember(
      teamMemberData,
      new mongoose.Types.ObjectId(eventUserId)
    );

    if (result.success) {
      return res.status(201).json({
        status: 1,
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(400).json({
        status: 0,
        message: result.message || "Failed to create team member",
      });
    }
  } catch (error: any) {
    loggerMsg("error", `Error in createEventCompanyTeamController: ${error.message}`);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};

/**
 * Update event company team member
 */
export const updateEventCompanyTeamController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const eventUserId = req.body.eventUser;
    const updateData = req.body;
    const files = req.files as Express.Multer.File[];

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid team member ID",
      });
    }

    if (!eventUserId || !mongoose.Types.ObjectId.isValid(eventUserId)) {
      return res.status(400).json({
        status: 0,
        message: "Valid Event User ID is required",
      });
    }

    // Remove system fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;
    delete updateData.eventUser; // Prevent changing the owner

    // Handle uploaded files
    if (files && Array.isArray(files)) {
      files.forEach((file) => {
        if (file.fieldname === "profile_picture") {
          updateData.profile_picture = `${(file as any).uploadFolder}/${file.filename}`;
        } else if (file.fieldname === "pan_card") {
          updateData.pan_card = `${(file as any).uploadFolder}/${file.filename}`;
        }
      });
    }

    const result = await updateEventCompanyTeamMember(
      new mongoose.Types.ObjectId(id),
      updateData,
      new mongoose.Types.ObjectId(eventUserId)
    );

    if (result.success) {
      return res.status(200).json({
        status: 1,
        message: result.message,
        data: result.data,
      });
    } else {
      const statusCode = result.message === "Team member not found or access denied" ? 404 : 400;
      return res.status(statusCode).json({
        status: 0,
        message: result.message || "Failed to update team member",
      });
    }
  } catch (error: any) {
    loggerMsg("error", `Error in updateEventCompanyTeamController: ${error.message}`);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};

/**
 * Get all event company team members
 */
export const getAllEventCompanyTeamController = async (req: Request, res: Response) => {
  try {
    const eventUser = req.query.eventUser as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const ownership = req.query.ownership as string;

    // Validate eventUser ID
    if (!eventUser || !mongoose.Types.ObjectId.isValid(eventUser)) {
      return res.status(400).json({
        status: 0,
        message: "Valid Event User ID is required",
      });
    }

    const result = await getAllEventCompanyTeamMembers(
      eventUser,
      page,
      limit,
      search,
      ownership
    );

    return successResponse(res, "Team members fetched successfully", result.data);
  } catch (error: any) {
    loggerMsg("error", `Error in getAllEventCompanyTeamController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

/**
 * Get event company team member by ID
 */
export const getEventCompanyTeamByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const eventUser = req.query.eventUser as string;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid team member ID",
      });
    }

    if (!eventUser || !mongoose.Types.ObjectId.isValid(eventUser)) {
      return res.status(400).json({
        status: 0,
        message: "Valid Event User ID is required",
      });
    }

    const result = await getEventCompanyTeamMemberById(id, eventUser);

    if (result.success) {
      return successResponse(res, "Team member fetched successfully", result.data);
    } else {
      return res.status(404).json({
        status: 0,
        message: result.message,
      });
    }
  } catch (error: any) {
    loggerMsg("error", `Error in getEventCompanyTeamByIdController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

/**
 * Delete event company team member by ID
 */
export const deleteEventCompanyTeamByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const eventUser = req.body.eventUser || req.query.eventUser;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid team member ID",
      });
    }

    if (!eventUser || !mongoose.Types.ObjectId.isValid(eventUser)) {
      return res.status(400).json({
        status: 0,
        message: "Valid Event User ID is required",
      });
    }

    const result = await deleteEventCompanyTeamMemberById(id, eventUser);

    if (result.success) {
      return successResponse(res, result.message, result.data);
    } else {
      return res.status(404).json({
        status: 0,
        message: result.message,
      });
    }
  } catch (error: any) {
    loggerMsg("error", `Error in deleteEventCompanyTeamByIdController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

/**
 * Get team members count by ownership
 */
export const getTeamMembersCountController = async (req: Request, res: Response) => {
  try {
    const eventUser = req.query.eventUser as string;

    // Validate eventUser ID
    if (!eventUser || !mongoose.Types.ObjectId.isValid(eventUser)) {
      return res.status(400).json({
        status: 0,
        message: "Valid Event User ID is required",
      });
    }

    const result = await getTeamMembersCountByOwnership(eventUser);

    return successResponse(res, "Team members count fetched successfully", result.data);
  } catch (error: any) {
    loggerMsg("error", `Error in getTeamMembersCountController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};