import { loggerMsg } from "../../lib/logger";
import jwt from "jsonwebtoken";
import formRegistrationSchema from "../schema/formRegistration.schema";
import userTypeSchema from "../schema/userType.schema";
import EventPackageSchema from "../schema/packageofEvents.schema";
import ticketSchema from "../schema/ticket.schema";
import { generateBadgeNumber, saveQrImage } from "./formRegistration.model";
import eventHostSchema from "../schema/eventHost.schema";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import exhibitorFormSchema from "../schema/exhibitorForm.schema";
import eventCategorySchema from "../schema/eventCategory.schema";

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

    const Attendees: any = await userTypeSchema
      .findOne({ typeName: "Event Attendees" })
      .sort({ order: 1 })
      .lean();    

    const eventcategory = await eventCategorySchema.find({
      compayId: loginUserData.company_id,
    });
    const categoriesWithEventCount = await Promise.all(
      eventcategory.map(async (category) => {
        const eventCount = await eventHostSchema.countDocuments({
          event_category: category._id,
          company_id: loginUserData.company_id,
        });

        // Return category with event count
        return {
          ...category.toObject(), // Convert mongoose document to plain object
          eventCount: eventCount,
        };
      })
    );

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
        title: ticket.eventId?.eventName || ticket.ticketName || "N/A",
        price: ticketPrice,
        description:
          ticket.description ||
          ticket.eventId?.event_description ||
          "No description available",
        type: "ticket",
        currency: ticket.ticketAmount.currency,
        eventTitle: ticket.eventId?.eventName,
        eventImage: ticket.eventId?.event_image,
        eventLogo: ticket.eventId?.event_logo,
        dataRange : ticket.eventId?.dateRanges,
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
        currency: pkg.currency,
        events:
          pkg.event_package?.map((evt: any) => ({
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
      data: {
        event_tickets : transformedTickets,
        combo_tickets : transformedPackages
      } 
    };

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
      eventcategory: categoriesWithEventCount,
      attendasData,
    });
  } catch (error: any) {
    loggerMsg("error", `Error fetching user events: ${error.message}`);
    callback(error, null);
  }
};

export const EventuserRegisterDefferntEventmodle = async (
  eventdata: any,
  token: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
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

    if (!eventdata) {
      const error = new Error("Event data not found");
      loggerMsg("error", `Event Data not Found`);
      return callback(error, null);
    }

    const Attendees: any = await userTypeSchema
      .findOne({ typeName: "Event Attendees" })
      .sort({ order: 1 })
      .lean();

    // Get existing exhibitor registration form
    const exibitorRefisterForm = await formRegistrationSchema
      .findOne({ email: loginUserData.email })
      .lean();

    if (!exibitorRefisterForm) {
      const error = new Error("User registration form not found");
      loggerMsg(
        "error",
        `Registration form not found for email: ${loginUserData.email}`
      );
      return callback(error, null);
    }

    let result;

    // ============ PACKAGE TYPE LOGIC ============
    if (eventdata.type === "package") {
      const packageData: any = await EventPackageSchema.findById(eventdata.id)
        .populate("event_package.event_Id", "title description price")
        .populate("event_package.event_category", "title description")
        .sort({ createdAt: -1 });

      if (!packageData) {
        const error = new Error("Package not found");
        loggerMsg("error", `Package not found with ID: ${eventdata.id}`);
        return callback(error, null);
      }

      const tickets: any = await ticketSchema.find({
        userType: Attendees?._id,
        companyId: loginUserData?.company_id,
      });

      if (!tickets || tickets.length === 0) {
        const error = new Error("No tickets found for this user");
        loggerMsg(
          "error",
          `No tickets found for company: ${loginUserData?.company_id}`
        );
        return callback(error, null);
      }

      // Auto-register user for each ticket
      const registrations = [];

      for (const ticket of tickets) {
        const eventId = ticket.eventId;
        const ticketId = ticket._id;

        // Check if user already registered for this event with this ticket
        const existingRegistration = await formRegistrationSchema.findOne({
          email: loginUserData.email,
          eventId: eventId,
          ticketId: ticketId,
        });

        if (existingRegistration) {
          registrations.push(existingRegistration);
          continue;
        }

        // Check if ticket is active
        if (ticket.status !== "active") {
          continue;
        }

        // Generate badge number
        const finalBadgeNo = await generateBadgeNumber(ticket);

        // Determine auto-approval from ticket settings
        const isAutoApproved =
          ticket.advancedSettings?.autoApprovedUser || false;

        // Prepare registration data
        const registrationData: any = {
          email: loginUserData.email.toLowerCase(),
          ticketId: ticketId,
          eventId: eventId,
          badgeNo: finalBadgeNo,
          formData: exibitorRefisterForm.formData,
          approved: isAutoApproved,
        };

        // Copy faceId and faceImageUrl from exhibitor registration
        if (exibitorRefisterForm.faceId) {
          registrationData.faceId = exibitorRefisterForm.faceId;
        }

        if (exibitorRefisterForm.faceImageUrl) {
          registrationData.faceImageUrl = exibitorRefisterForm.faceImageUrl;
        }

        // Copy business data if exists
        if (exibitorRefisterForm.businessData) {
          registrationData.businessData = exibitorRefisterForm.businessData;
        }

        const registration = new formRegistrationSchema(registrationData);
        await registration.save();

        // Generate user token for QR code
        const userToken = uuidv4();
        let qrCodeBase64 = null;
        let qrFileName = null;
        let eventDetails = await eventHostSchema.findById(eventId);

        if (eventDetails) {
          // Generate QR code data
          const qrData = JSON.stringify({
            event_id: eventDetails._id,
            event_slug: eventDetails.event_slug,
            formRegistration_id: registration._id,
          });

          // Generate base64 QR code
          qrCodeBase64 = await QRCode.toDataURL(qrData);

          // Save QR code as file
          qrFileName = saveQrImage(qrCodeBase64, userToken);
          registration.qrImage = `${qrFileName}`;
          await registration.save();
        }

        registrations.push(registration);
      }

      result = {
        packageData,
        tickets,
        exibitorRefisterForm,
        newRegistrations: registrations,
        message: `Successfully registered for ${registrations.length} event(s)`,
      };
    }

    // ============ TICKET TYPE LOGIC ============
    else if (eventdata.type === "ticket") {
      // Find the specific ticket by ID
      const ticketData: any = await ticketSchema
        .findById(eventdata.id)
        .populate("eventId", "title description event_slug")
        .populate("userType", "typeName")
        .lean();

      if (!ticketData) {
        const error = new Error("Ticket not found");
        loggerMsg("error", `Ticket not found with ID: ${eventdata.id}`);
        return callback(error, null);
      }

      // Verify ticket belongs to the user's company
      if (
        ticketData.companyId?.toString() !==
        loginUserData?.company_id?.toString()
      ) {
        const error = new Error("Ticket does not belong to your company");
        loggerMsg(
          "error",
          `Unauthorized ticket access attempt by ${loginUserData.email}`
        );
        return callback(error, null);
      }

      const eventId = ticketData.eventId._id;
      const ticketId = ticketData._id;

      // Check if user already registered for this event with this ticket
      const existingRegistration = await formRegistrationSchema.findOne({
        email: loginUserData.email,
        eventId: eventId,
        ticketId: ticketId,
      });

      if (existingRegistration) {
        result = {
          ticketData,
          registration: existingRegistration,
          message: "You are already registered for this event with this ticket",
          alreadyRegistered: true,
        };
      } else {
        // Check if ticket is active
        if (ticketData.status !== "active") {
          const error = new Error("Ticket is not active");
          loggerMsg("error", `Inactive ticket access attempt: ${ticketId}`);
          return callback(error, null);
        }

        // Generate badge number
        const finalBadgeNo = await generateBadgeNumber(ticketData);

        // Determine auto-approval from ticket settings
        const isAutoApproved =
          ticketData.advancedSettings?.autoApprovedUser || false;

        // Prepare registration data
        const registrationData: any = {
          email: loginUserData.email.toLowerCase(),
          ticketId: ticketId,
          eventId: eventId,
          badgeNo: finalBadgeNo,
          formData: exibitorRefisterForm.formData,
          approved: isAutoApproved,
        };

        // Copy faceId and faceImageUrl from exhibitor registration
        if (exibitorRefisterForm.faceId) {
          registrationData.faceId = exibitorRefisterForm.faceId;
        }

        if (exibitorRefisterForm.faceImageUrl) {
          registrationData.faceImageUrl = exibitorRefisterForm.faceImageUrl;
        }

        // Copy business data if exists
        if (exibitorRefisterForm.businessData) {
          registrationData.businessData = exibitorRefisterForm.businessData;
        }

        // Create new registration
        const registration = new formRegistrationSchema(registrationData);
        await registration.save();

        // Generate user token for QR code
        const userToken = uuidv4();
        let qrCodeBase64 = null;
        let qrFileName = null;
        let eventDetails = await eventHostSchema.findById(eventId);

        if (eventDetails) {
          // Generate QR code data
          const qrData = JSON.stringify({
            event_id: eventDetails._id,
            event_slug: eventDetails.event_slug,
            formRegistration_id: registration._id,
          });

          // Generate base64 QR code
          qrCodeBase64 = await QRCode.toDataURL(qrData);

          // Save QR code as file
          qrFileName = saveQrImage(qrCodeBase64, userToken);
          registration.qrImage = `${qrFileName}`;
          await registration.save();
        }

        result = {
          ticketData,
          registration,
          exibitorRefisterForm,
          message: "Successfully registered for the event",
          alreadyRegistered: false,
        };
      }
    }

    // ============ INVALID TYPE ============
    else {
      const error = new Error(
        "Invalid event data type. Must be 'package' or 'ticket'"
      );
      loggerMsg("error", `Invalid type received: ${eventdata.type}`);
      return callback(error, null);
    }

    callback(null, { result });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in EventuserRegisterDefferntEventmodle: ${error.message}`
    );
    callback(error, null);
  }
};

export const ExhibitorFromeventwiseModle = async (
  eventId: any,
  token: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
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

    if (!eventId) {
      const error = new Error("Event data not found");
      loggerMsg("error", `Event Data not Found`);
      return callback(error, null);
    }

    let eventFormList = await exhibitorFormSchema.find({
      eventId: eventId,
      status: "published",
    });
    callback(null, {
      eventFormList,
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in EventuserRegisterDefferntEventmodle: ${error.message}`
    );
    callback(error, null);
  }
};

export const EventusercategorywiseEventModle = async (
  eventcatId: any,
  token: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
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

    if (!eventcatId) {
      const error = new Error("Event category ID is required");
      loggerMsg("error", `Event category ID not provided`);
      return callback(error, null);
    }

    // Step 1: Find events by category
    const events = await eventHostSchema
      .find({
        event_category: eventcatId,
      })
      .select(
        "_id event_title event_slug event_description event_logo event_image event_category"
      );

    // Step 2: Extract event IDs
    const eventIds = events.map((event) => event._id);

    // Step 3: Find form registrations for these events and this user
    const eventDetails = await formRegistrationSchema
      .find({
        email: loginUserData.email,
        eventId: { $in: eventIds },
      })
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
            "event_title event_slug event_description event_logo event_image event_category dateRanges",
        },
      ]);

    // Check if eventDetails is empty
    if (!eventDetails || eventDetails.length === 0) {
      callback(null, {
        events,
        eventDetails: [],
        message: "You are not registered for any event in this category",
      });
      return;
    }

    callback(null, {
      events,
      eventDetails,
      message: "Event details retrieved successfully",
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in EventusercategorywiseEventModle: ${error.message}`
    );
    callback(error, null);
  }
};
