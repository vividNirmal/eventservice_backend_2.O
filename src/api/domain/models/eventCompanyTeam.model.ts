import { loggerMsg } from "../../lib/logger";
import { env } from "../../../infrastructure/env";
import EventCompanyTeamSchema, { IEventCompanyTeam } from "../schema/eventCompanyTeam.schema";
import mongoose from "mongoose";

/**
 * Add URLs to file fields
 */
const addFileUrls = (teamMember: any) => {
  const baseUrl = env.BASE_URL;
  if (teamMember?.profile_picture) {
    teamMember.profilePictureUrl = `${baseUrl}/uploads/${teamMember.profile_picture}`;
  }
  if (teamMember?.pan_card) {
    teamMember.panCardUrl = `${baseUrl}/uploads/${teamMember.pan_card}`;
  }
  return teamMember;
};

/**
 * Create event company team member
 */
export const createEventCompanyTeamMember = async (
  teamMemberData: Partial<IEventCompanyTeam>,
  eventUserId: mongoose.Types.ObjectId
) => {
  try {
    // Check if email already exists for this event user
    const existingMember = await EventCompanyTeamSchema.findOne({
      email: teamMemberData.email?.toLowerCase(),
      eventUser: eventUserId,
    });

    if (existingMember) {
      return {
        success: false,
        message: "Team member with this email already exists",
      };
    }

    // Check if PAN number already exists (if provided)
    if (teamMemberData.pan_no) {
      const existingPan = await EventCompanyTeamSchema.findOne({
        pan_no: teamMemberData.pan_no,
        eventUser: eventUserId,
      });

      if (existingPan) {
        return {
          success: false,
          message: "Team member with this PAN number already exists",
        };
      }
    }

    const newMember = new EventCompanyTeamSchema({
      ...teamMemberData,
      email: teamMemberData.email?.toLowerCase(),
      eventUser: eventUserId,
    });

    const saved = await newMember.save();

    // Populate location details
    const populated = await EventCompanyTeamSchema.findById(saved._id)
      .populate('country', 'name')
      .populate('state', 'name')
      .populate('city', 'name');

    const memberWithUrls = addFileUrls(populated?.toObject());
    loggerMsg("info", `Event company team member created: ${saved._id}`);

    return {
      success: true,
      data: memberWithUrls,
      message: "Team member created successfully",
    };
  } catch (error: any) {
    console.log("error", error)
    loggerMsg("error", `Error creating team member: ${error.message}`);
    return {
      success: false,
      message: "Failed to create team member",
      error: error.message,
    };
  }
};

/**
 * Update event company team member
 */
export const updateEventCompanyTeamMember = async (
  id: mongoose.Types.ObjectId,
  updateData: Partial<IEventCompanyTeam>,
  eventUserId: mongoose.Types.ObjectId
) => {
  try {
    // Check if team member exists and belongs to the event user
    const existingMember = await EventCompanyTeamSchema.findOne({
      _id: id,
      eventUser: eventUserId,
    });

    if (!existingMember) {
      return {
        success: false,
        message: "Team member not found or access denied",
      };
    }

    // Check email uniqueness if being updated
    if (updateData.email && updateData.email !== existingMember.email) {
      const emailExists = await EventCompanyTeamSchema.findOne({
        _id: { $ne: id },
        email: updateData.email.toLowerCase(),
        eventUser: eventUserId,
      });

      if (emailExists) {
        return {
          success: false,
          message: "Team member with this email already exists",
        };
      }
    }

    // Check PAN uniqueness if being updated
    if (updateData.pan_no && updateData.pan_no !== existingMember.pan_no) {
      const panExists = await EventCompanyTeamSchema.findOne({
        _id: { $ne: id },
        pan_no: updateData.pan_no,
        eventUser: eventUserId,
      });

      if (panExists) {
        return {
          success: false,
          message: "Team member with this PAN number already exists",
        };
      }
    }

    // Update email to lowercase if provided
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    const updated = await EventCompanyTeamSchema.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('country', 'name')
      .populate('state', 'name')
      .populate('city', 'name');

    if (!updated) {
      return {
        success: false,
        message: "Team member not found",
      };
    }

    const memberWithUrls = addFileUrls(updated.toObject());
    loggerMsg("info", `Event company team member updated: ${id}`);

    return {
      success: true,
      data: memberWithUrls,
      message: "Team member updated successfully",
    };
  } catch (error: any) {
    loggerMsg("error", `Error updating team member: ${error.message}`);
    return {
      success: false,
      message: "Failed to update team member",
      error: error.message,
    };
  }
};

/**
 * Get all event company team members
 */
export const getAllEventCompanyTeamMembers = async (
  eventUserId: string,
  page: number = 1,
  limit: number = 10,
  search?: string,
  ownership?: string
) => {
  try {
    const skip = (page - 1) * limit;
    const query: any = { eventUser: eventUserId };

    // Add search filter
    if (search) {
      query.$or = [
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { contact_no: { $regex: search, $options: "i" } },
      ];
    }

    // Add ownership filter
    if (ownership && ownership !== "all") {
      query.ownership = ownership;
    }

    const teams = await EventCompanyTeamSchema.find(query)
      .populate('country', 'name')
      .populate('state', 'name')
      .populate('city', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalData = await EventCompanyTeamSchema.countDocuments(query);
    const teamsWithUrls = teams.map(member => addFileUrls(member.toObject()));

    return {
      success: true,
      data: {
        teams: teamsWithUrls,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalData / limit),
          totalData,
          limit,
        },
      },
    };
  } catch (error: any) {
    loggerMsg("error", `Error fetching team members: ${error.message}`);
    throw new Error(error.message);
  }
};

/**
 * Get event company team member by ID
 */
export const getEventCompanyTeamMemberById = async (
  id: string,
  eventUserId: string
) => {
  try {
    const member = await EventCompanyTeamSchema.findOne({
      _id: id,
      eventUser: eventUserId,
    })
      .populate('country', 'name')
      .populate('state', 'name')
      .populate('city', 'name');

    if (!member) {
      return {
        success: false,
        message: "Team member not found",
      };
    }

    const memberWithUrls = addFileUrls(member.toObject());

    return {
      success: true,
      data: memberWithUrls,
    };
  } catch (error: any) {
    loggerMsg("error", `Error fetching team member by ID: ${error.message}`);
    throw new Error(error.message);
  }
};

/**
 * Delete event company team member by ID
 */
export const deleteEventCompanyTeamMemberById = async (
  id: string,
  eventUserId: string
) => {
  try {
    const deleted = await EventCompanyTeamSchema.findOneAndDelete({
      _id: id,
      eventUser: eventUserId,
    });

    if (!deleted) {
      return {
        success: false,
        message: "Team member not found or access denied",
      };
    }

    const memberWithUrls = addFileUrls(deleted.toObject());

    return {
      success: true,
      data: memberWithUrls,
      message: "Team member deleted successfully",
    };
  } catch (error: any) {
    loggerMsg("error", `Error deleting team member: ${error.message}`);
    throw new Error(error.message);
  }
};

/**
 * Get team members count by ownership type
 */
export const getTeamMembersCountByOwnership = async (eventUserId: string) => {
  try {
    const counts = await EventCompanyTeamSchema.aggregate([
      { $match: { eventUser: new mongoose.Types.ObjectId(eventUserId) } },
      {
        $group: {
          _id: "$ownership",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = counts.reduce((acc: any, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const total = await EventCompanyTeamSchema.countDocuments({
      eventUser: eventUserId,
    });

    return {
      success: true,
      data: {
        ...result,
        total,
      },
    };
  } catch (error: any) {
    loggerMsg("error", `Error getting team members count: ${error.message}`);
    throw new Error(error.message);
  }
};