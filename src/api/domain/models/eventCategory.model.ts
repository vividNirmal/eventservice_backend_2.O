import { loggerMsg } from "../../lib/logger";
import eventCategorySchema from "../schema/eventCategory.schema";
import jwt from "jsonwebtoken";
import eventHostSchema from "../schema/eventHost.schema";

export const createEventCategoryModule = async (
  data: any,
  token: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Check if event category already exists
    if (!token) {
      const error = new Error("Authentication token is required");
      loggerMsg("error", "User token is missing");
      return callback(error, null);
    }

    const existingCategory = await eventCategorySchema.findOne({
      title: data.title,
    });

    if (existingCategory) {
      return callback(
        new Error("Event category with this title already exists")
      );
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
    // Extract company_id from token data
    const companyId = data.company_id;
    if (!companyId) {
      return callback(new Error("Company ID not found in payload"));
    }

    // Add company_id to the event category data
    const categoryData = {
      ...data,
      compayId: companyId,
    };

    const newCategory = new eventCategorySchema(categoryData);
    const savedCategory = await newCategory.save();
    const allCategory = await eventCategorySchema.find({});
    callback(null, { eventCategory: allCategory, savedCategory });
  } catch (error: any) {
    loggerMsg("error", `Error creating event category: ${error}`);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return callback(
        new Error("Event category with this title already exists")
      );
    }

    callback(error, null);
  }
};

export const getAllEventCategories = async (
  companyId: any,
  callback: (error: Error | null, result?: any) => void,
  page: number = 1,
  limit?: number,
  search?: string
) => {
  try {
    // Verify token and get company ID
    if (!process.env.JWT_SECRET_KEY) {
      return callback(new Error("JWT secret key is not configured"));
    }

    if (!companyId) {
      return callback(new Error("Company ID not found in token"));
    }

    const searchQuery: any = {
      compayId: companyId, // Filter by company ID
    };

    if (search) {
      searchQuery.title = { $regex: search, $options: "i" };
    }

    if (!limit || limit === 0) {
      const eventCategories = await eventCategorySchema
        .find(searchQuery)
        .sort({ createdAt: -1 });

      callback(null, {
        eventCategories,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalData: eventCategories.length,
          limit: eventCategories.length,
        },
      });
    } else {
      const skip = (page - 1) * limit;
      const eventCategories = await eventCategorySchema
        .find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalData = await eventCategorySchema.countDocuments(searchQuery);
      callback(null, {
        eventCategories,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalData / limit),
          totalData,
          limit,
        },
      });
    }
  } catch (error: any) {
    loggerMsg("error", `Error fetching event categories: ${error}`);
    callback(error, null);
  }
};

export const getEventCategoryById = async (
  id: string,
  token: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Verify token and get company ID
    if (!process.env.JWT_SECRET_KEY) {
      return callback(new Error("JWT secret key is not configured"));
    }

    const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;
    const loginUserData: any = jwt.verify(
      actualToken,
      process.env.JWT_SECRET_KEY
    );
    // const companyId = loginUserData.company_id;

    const eventCategory = await eventCategorySchema.findOne({
      _id: id,
      // compayId: companyId,
    });

    if (!eventCategory) {
      return callback(new Error("Event category not found"));
    }

    callback(null, { eventCategory });
  } catch (error: any) {
    loggerMsg("error", `Error fetching event category by ID: ${error}`);
    callback(error, null);
  }
};

export const updateEventCategoryById = async (
  id: string,
  data: any,
  token: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Verify token and get company ID
    if (!process.env.JWT_SECRET_KEY) {
      return callback(new Error("JWT secret key is not configured"));
    }

    const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;
    const loginUserData: any = jwt.verify(
      actualToken,
      process.env.JWT_SECRET_KEY
    );
    const companyId = data?.company_id;

    if (data.title) {
      const existingCategory = await eventCategorySchema.findOne({
        title: data.title,
        _id: { $ne: id },
        compayId: companyId,
      });

      if (existingCategory) {
        return callback(
          new Error("Event category with this title already exists")
        );
      }
    }

    const updatedCategory = await eventCategorySchema.findOneAndUpdate(
      { _id: id, compayId: companyId },
      data,
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return callback(new Error("Event category not found"));
    }

    callback(null, { eventCategory: updatedCategory });
  } catch (error: any) {
    loggerMsg("error", `Error updating event category: ${error}`);
    callback(error, null);
  }
};

export const deleteEventCategoryById = async (
  id: string,
  token: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Verify token and get company ID
    if (!process.env.JWT_SECRET_KEY) {
      return callback(new Error("JWT secret key is not configured"));
    }

    const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;
    const loginUserData: any = jwt.verify(
      actualToken,
      process.env.JWT_SECRET_KEY
    );
    // const companyId = loginUserData.company_id;

    const deletedCategory = await eventCategorySchema.findOneAndDelete({
      _id: id,
      // compayId: companyId,
    });

    if (!deletedCategory) {
      return callback(new Error("Event category not found"));
    }

    callback(null, { eventCategory: deletedCategory });
  } catch (error: any) {
    loggerMsg("error", `Error deleting event category: ${error}`);
    callback(error, null);
  }
};

export const getEventByCategory =async(id:string,callback: (error: Error | null, result?: any) => void)=>{
  try {
    const event  = await eventHostSchema.find({event_category:id}).populate('event_category');
    if (!event) {
      return callback(new Error("Event category not found"));
    }
    callback(null, {  event });
  }
  catch (error: any) {
    loggerMsg("error", `Error fetching events by category: ${error}`);
    callback(error, null);
  }
};
