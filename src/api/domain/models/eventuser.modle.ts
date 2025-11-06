import { loggerMsg } from "../../lib/logger";
import jwt from "jsonwebtoken";
import formRegistrationSchema from "../schema/formRegistration.schema";
import userTypeSchema from "../schema/userType.schema";

export const eventuserEvent = async (
  callback: (error: Error | null, result?: any) => void,
  page: number = 1,
  limit: number = 20,
  search?: string,
  token?: string
) => {
  try {
    // Validate token presence
    if (!token) {
      const error = new Error("Authentication token is required");
      loggerMsg("error", "User token is missing");
      return callback(error, null);
    }

    // Validate JWT secret
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

    const userTypes = await userTypeSchema.find().sort({ order: 1 }).lean();
    const eventDetails: any = await formRegistrationSchema
      .find({ email: loginUserData.email })
      .populate([
        {
          path: "ticketId",
          populate: { path: "userType", select: "typeName" },
          select: "ticketName userType registrationFormId",
        },
        {
          path: "eventId",
          populate: { path: "event_category" },
          select: "event_title event_slug event_description event_logo event_image event_category",          
        },
      ]);
    const groupedData = userTypes.map((userType) => {
      const filteredEvents = eventDetails.filter(
        (item: any) =>
          item.ticketId?.userType?._id?.toString() === userType._id.toString()
      );

      return {
        userType: userType.typeName,
        userTypeId: userType._id,
        order: userType.order,
        count: filteredEvents.length,
        data: filteredEvents,
      };
    });        
    const skip = (page - 1) * limit;    
    const searchQuery: any = {
      userId: loginUserData.userId || loginUserData.id, 
    };

    if (search) {
      searchQuery.$or = [
        { param_name: { $regex: search, $options: "i" } },
        { event_name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }    
    callback(null, {
      groupedData,
    });
  } catch (error: any) {
    loggerMsg("error", `Error fetching user events: ${error.message}`);
    callback(error, null);
  }
};
