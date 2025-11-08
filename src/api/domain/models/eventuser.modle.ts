import { loggerMsg } from "../../lib/logger";
import jwt from "jsonwebtoken";
import formRegistrationSchema from "../schema/formRegistration.schema";
import userTypeSchema from "../schema/userType.schema";
import EventPackageSchema from "../schema/packageofEvents.schema";
import ticketSchema from "../schema/ticket.schema";

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

    const userTypes: any = await userTypeSchema
      .find()
      .sort({ order: 1 })
      .lean();

    const Attendees: any = await userTypeSchema
      .findOne({ typeName: "Event Attendees" })
      .sort({ order: 1 })
      .lean();

    const eventDetails: any = await formRegistrationSchema
      .find({ email: loginUserData.email })
      .populate([
        {
          path: "ticketId",
          populate: { path: "userType", select: "typeName" },
          select: "ticketName userType registrationFormId ticketAmount",
        },
        {
          path: "eventId",
          populate: { path: "event_category" },
          select:
            "event_title event_slug event_description event_logo event_image event_category",
        },
      ]);

    const eventPackages = await EventPackageSchema.find({
      companyId: loginUserData?.company_id,
    })
      .populate("companyId", "name email phone")
      .populate("event_package.event_Id", "title description price")
      .populate("event_package.event_category", "title description")
      .sort({ createdAt: -1 });

    const tickets: any = await ticketSchema
      .find({ userType: Attendees?._id, companyId: loginUserData?.company_id })
      .populate({
        path: "eventId",
        populate: "event_category",
      });

    // Transform tickets data
    const transformedTickets = tickets.map((ticket: any) => {
      // Get ticket price based on type
      let ticketPrice = 0;
      if (ticket.ticketAmount?.type === "free") {
        ticketPrice = 0;
      } else if (ticket.ticketAmount?.type === "paid") {
        ticketPrice = ticket.ticketAmount?.amount || 0;
      } else if (ticket.ticketAmount?.type === "businessSlab") {
        // Get the first business slab price if available
        const firstSlab = ticket.ticketAmount?.businessSlabs?.[0];
        ticketPrice = firstSlab?.categoryAmounts?.[0]?.amount || 0;
      } else if (ticket.ticketAmount?.type === "dateRange") {
        // Get the first date range price if available
        const firstRange = ticket.ticketAmount?.dateRangeAmounts?.[0];
        ticketPrice = firstRange?.amount || 0;
      }

      return {
        _id: ticket._id,
        title: ticket.ticketName || ticket.eventId?.event_title || "N/A",
        price: ticketPrice,
        description: ticket.description || ticket.eventId?.event_description || "No description available",
        type: "ticket",
        eventTitle: ticket.eventId?.event_title,
        eventImage: ticket.eventId?.event_image,
        eventLogo: ticket.eventId?.event_logo,
        category: ticket.eventId?.event_category?.title,
        ticketCategory: ticket.ticketCategory,
        status: ticket.status,
        createdAt: ticket.createdAt,
        originalData: ticket, // Keep original data if needed
      };
    });

    // Transform event packages data
    const transformedPackages = eventPackages.map((pkg: any) => {
      return {
        _id: pkg._id,
        title: pkg.title || "Event Package",
        price: parseFloat(pkg.package_total_price || 0),
        description: pkg.description || "No description available",
        type: "package",
        events: pkg.event_package?.map((evt: any) => ({
          eventId: evt.event_Id?._id,
          categoryTitle: evt.event_category?.title,
          eventPrice: parseFloat(evt.event_price || 0),
        })) || [],
        companyInfo: pkg.companyId,
        createdAt: pkg.createdAt,
        originalData: pkg, // Keep original data if needed
      };
    });

    // Combine transformed data
    const attendasData = {
      userType: "Event Attendees",
      userTypeId: Attendees?._id,
      order: Attendees?.order || 1,
      count: transformedTickets.length + transformedPackages.length,
      data: [...transformedTickets, ...transformedPackages],
    };

    const groupedData = userTypes.map((userType: any) => {
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
      attendasData,
    });
  } catch (error: any) {
    loggerMsg("error", `Error fetching user events: ${error.message}`);
    callback(error, null);
  }
};
