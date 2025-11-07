import { loggerMsg } from "../../lib/logger";
import eventHostSchema from "../schema/eventHost.schema";
import EventPackageSchema from "../schema/packageofEvents.schema";
import jwt from "jsonwebtoken";
import ticketSchema from "../schema/ticket.schema";
import userTypeSchema from "../schema/userType.schema";

export const createEventPackageModule = async (
  data: any,
  token: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Validate token
    if (!token) {
      const error = new Error("Authentication token is required");
      loggerMsg("error", "User token is missing");
      return callback(error, null);
    }

    if (!process.env.JWT_SECRET_KEY) {
      const error = new Error("JWT secret key is not configured");
      loggerMsg("error", "JWT_SECRET_KEY is missing in environment");
      return callback(error, null);
    }

    // Verify and decode token
    let loginUserData: any;
    try {
      const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;
      loginUserData = jwt.verify(actualToken, process.env.JWT_SECRET_KEY);
    } catch (jwtError: any) {
      const error = new Error("Invalid or expired token");
      loggerMsg("error", `JWT verification failed: ${jwtError.message}`);
      return callback(error, null);
    }

    // Extract company_id from token
    const companyId = loginUserData.company_id;
    if (!companyId) {
      return callback(new Error("Company ID not found in token"));
    }

    // Check if package title already exists for the same company
    const existingPackage = await EventPackageSchema.findOne({
      title: data.title,
      companyId: companyId,
    });

    if (existingPackage) {
      return callback(
        new Error(
          "Event package with this title already exists for this company"
        )
      );
    }

    // Validate that event_package array is not empty
    if (!data.event_package || data.event_package.length === 0) {
      return callback(
        new Error("At least one event must be included in the package")
      );
    }

    // Calculate total package price if not provided
    if (!data.package_total_price || data.package_total_price === "0") {
      const totalPrice = data.event_package.reduce(
        (sum: number, event: any) => {
          return sum + (parseFloat(event.event_price) || 0);
        },
        0
      );
      data.package_total_price = totalPrice.toString();
    }

    // Add company_id to the package data
    const packageData = {
      ...data,
      companyId: companyId,
    };

    const newPackage = new EventPackageSchema(packageData);
    const savedPackage = await newPackage.save();

    // Populate references for the response
    const populatedPackage = await EventPackageSchema.findById(savedPackage._id)
      .populate("companyId", "name email")
      .populate("event_package.event_Id", "title description")
      .populate("event_package.event_category", "title");

    callback(null, { eventPackage: populatedPackage });
  } catch (error: any) {
    loggerMsg("error", `Error creating event package: ${error}`);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return callback(
        new Error("Event package with this title already exists")
      );
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(", ");
      return callback(new Error(messages));
    }

    callback(error, null);
  }
};

export const getAllEventPackages = async (
  callback: (error: Error | null, result?: any) => void,
  page: number = 1,
  limit: number = 10,
  search?: string,
  token?: any
) => {
  try {
    const skip = (page - 1) * limit;

    const searchQuery: any = {};

    // Get company ID from token if provided
    if (token) {
      try {
        if (!process.env.JWT_SECRET_KEY) {
          const error = new Error("JWT secret key is not configured");
          loggerMsg("error", "JWT_SECRET_KEY is missing in environment");
          return callback(error, null);
        }

        const actualToken = token.startsWith("Bearer ")
          ? token.slice(7)
          : token;
        const loginUserData: any = jwt.verify(
          actualToken,
          process.env.JWT_SECRET_KEY
        );
        const companyId = loginUserData.company_id;

        if (companyId) {
          searchQuery.companyId = companyId;
        }
      } catch (jwtError: any) {
        loggerMsg("error", `JWT verification failed: ${jwtError.message}`);
        return callback(new Error("Invalid or expired token"), null);
      }
    }

    // Search by title or description
    if (search) {
      searchQuery.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const eventPackages = await EventPackageSchema.find(searchQuery)
      .populate("companyId", "name email phone")
      .populate("event_package.event_Id", "title description price")
      .populate("event_package.event_category", "title description")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalData = await EventPackageSchema.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalData / limit);

    callback(null, {
      eventPackages,
      pagination: {
        currentPage: page,
        totalPages,
        totalData,
        limit,
      },
    });
  } catch (error: any) {
    loggerMsg("error", `Error fetching event packages: ${error}`);
    callback(error, null);
  }
};

export const getEventPackageById = async (
  packageId: string,
  token: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Validate token
    if (!token) {
      const error = new Error("Authentication token is required");
      loggerMsg("error", "User token is missing");
      return callback(error, null);
    }

    if (!process.env.JWT_SECRET_KEY) {
      const error = new Error("JWT secret key is not configured");
      loggerMsg("error", "JWT_SECRET_KEY is missing in environment");
      return callback(error, null);
    }

    // Verify and decode token
    let loginUserData: any;
    try {
      const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;
      loginUserData = jwt.verify(actualToken, process.env.JWT_SECRET_KEY);
    } catch (jwtError: any) {
      const error = new Error("Invalid or expired token");
      loggerMsg("error", `JWT verification failed: ${jwtError.message}`);
      return callback(error, null);
    }

    const companyId = loginUserData.company_id;

    const eventPackage = await EventPackageSchema.findOne({
      _id: packageId,
      companyId: companyId, // Ensure user can only access their company's packages
    })
      .populate("companyId", "name email phone address")
      .populate("event_package.event_Id", "title description price duration")
      .populate("event_package.event_category", "title description");

    if (!eventPackage) {
      return callback(new Error("Event package not found"));
    }

    callback(null, { eventPackage });
  } catch (error: any) {
    loggerMsg("error", `Error fetching event package by ID: ${error}`);
    callback(error, null);
  }
};

export const updateEventPackageModule = async (
  packageId: string,
  data: any,
  token: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Validate token
    if (!token) {
      const error = new Error("Authentication token is required");
      loggerMsg("error", "User token is missing");
      return callback(error, null);
    }

    if (!process.env.JWT_SECRET_KEY) {
      const error = new Error("JWT secret key is not configured");
      loggerMsg("error", "JWT_SECRET_KEY is missing in environment");
      return callback(error, null);
    }

    // Verify and decode token
    let loginUserData: any;
    try {
      const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;
      loginUserData = jwt.verify(actualToken, process.env.JWT_SECRET_KEY);
    } catch (jwtError: any) {
      const error = new Error("Invalid or expired token");
      loggerMsg("error", `JWT verification failed: ${jwtError.message}`);
      return callback(error, null);
    }

    // Extract company_id from token
    const companyId = loginUserData.company_id;
    if (!companyId) {
      return callback(new Error("Company ID not found in token"));
    }

    // Check if package exists and belongs to this company
    const existingPackage = await EventPackageSchema.findOne({
      _id: packageId,
      companyId: companyId,
    });

    if (!existingPackage) {
      return callback(
        new Error(
          "Event package not found or you don't have permission to update it"
        )
      );
    }

    // If title is being updated, check if new title already exists
    if (data.title && data.title !== existingPackage.title) {
      const duplicateTitle = await EventPackageSchema.findOne({
        title: data.title,
        companyId: companyId,
        _id: { $ne: packageId }, // Exclude current package
      });

      if (duplicateTitle) {
        return callback(
          new Error(
            "Another package with this title already exists for this company"
          )
        );
      }
    }

    // Recalculate total price if event_package is updated
    if (data.event_package && Array.isArray(data.event_package)) {
      const totalPrice = data.event_package.reduce(
        (sum: number, event: any) => {
          return sum + (parseFloat(event.event_price) || 0);
        },
        0
      );
      data.package_total_price = totalPrice.toString();
    }

    // Update the package
    const updatedPackage = await EventPackageSchema.findByIdAndUpdate(
      packageId,
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate("companyId", "name email phone")
      .populate("event_package.event_Id", "title description price")
      .populate("event_package.event_category", "title description");

    if (!updatedPackage) {
      return callback(new Error("Failed to update event package"));
    }

    callback(null, { eventPackage: updatedPackage });
  } catch (error: any) {
    loggerMsg("error", `Error updating event package: ${error}`);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(", ");
      return callback(new Error(messages));
    }

    callback(error, null);
  }
};

export const deleteEventPackagesModule = async (
  package_ids: string[],
  token: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Validate token
    if (!token) {
      const error = new Error("Authentication token is required");
      loggerMsg("error", "User token is missing");
      return callback(error, null);
    }

    if (!process.env.JWT_SECRET_KEY) {
      const error = new Error("JWT secret key is not configured");
      loggerMsg("error", "JWT_SECRET_KEY is missing in environment");
      return callback(error, null);
    }

    // Verify and decode token
    let loginUserData: any;
    try {
      const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;
      loginUserData = jwt.verify(actualToken, process.env.JWT_SECRET_KEY);
    } catch (jwtError: any) {
      const error = new Error("Invalid or expired token");
      loggerMsg("error", `JWT verification failed: ${jwtError.message}`);
      return callback(error, null);
    }

    const companyId = loginUserData.company_id;
    if (!companyId) {
      return callback(new Error("Company ID not found in token"));
    }

    // Delete packages belonging to the company only
    const result = await EventPackageSchema.deleteMany({
      _id: { $in: package_ids },
      companyId: companyId, // Ensure user can only delete their company's packages
    });

    if (result.deletedCount === 0) {
      return callback(
        new Error(
          "No event packages found with the provided IDs for your company"
        )
      );
    }

    callback(null, { deletedCount: result.deletedCount });
  } catch (error: any) {
    loggerMsg("error", `Error deleting event packages: ${error}`);
    callback(error, null);
  }
};

export const eventandCategoryAttendesModule = async (
  token: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    if (!token) {
      const error = new Error("Authentication token is required");
      loggerMsg("error", "User token is missing");
      return callback(error, null);
    }
    if (!process.env.JWT_SECRET_KEY) {
      const error = new Error("JWT secret key is not configured");
      loggerMsg("error", "JWT_SECRET_KEY is missing in environment");
      return callback(error, null);
    }
    let loginUserData: any;
    try {
      const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;
      loginUserData = jwt.verify(actualToken, process.env.JWT_SECRET_KEY);
    } catch (jwtError: any) {
      const error = new Error("Invalid or expired token");
      loggerMsg("error", `JWT verification failed: ${jwtError.message}`);
      return callback(error, null);
    }

    const companyId = loginUserData.company_id;
    if (!companyId) {
      return callback(new Error("Company ID not found in token"));
    }
    const Events: any = await eventHostSchema
      .find({ company_id: companyId })
      .populate("event_category");
    const userType: any = await userTypeSchema
      .findOne({ typeName: "Event Attendees" })
      .sort({ order: 1 })
      .lean();    
    //  find userType if
    const tickets: any = await ticketSchema
      .find({ userType: userType._id, companyId: companyId })
      .populate({
        path: "eventId",
        populate: "event_category",
      });    
    callback(null,  tickets );
  } catch (error: any) {
    loggerMsg("error", `Error deleting event packages: ${error}`);
    callback(error, null);
  }
};
