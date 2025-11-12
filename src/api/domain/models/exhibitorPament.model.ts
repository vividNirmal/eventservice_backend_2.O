import { loggerMsg } from "../../lib/logger";
import PaymentHistory from "../schema/exihibitorPayment.schema";
import EventPackageSchema from "../schema/packageofEvents.schema";
import ticketSchema from "../schema/ticket.schema";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";

/**
 * Generate a unique transaction number
 */
const generateTransactionNumber = (): string => {
  const timestamp = Date.now().toString();
  const randomStr = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `TXN${timestamp}${randomStr}`;
};

/**
 * Verify JWT token and extract user data
 */
const verifyToken = (token: string) => {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  if (!process.env.JWT_SECRET_KEY) {
    throw new Error("JWT secret key is not configured");
  }

  const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;
  return jwt.verify(actualToken, process.env.JWT_SECRET_KEY);
};

/**
 * Create Payment History
 */
export const createPaymentHistoryModule = async (
  data: any,
  token: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Verify token
    let loginUserData: any;
    try {
      loginUserData = verifyToken(token);
    } catch (jwtError: any) {
      loggerMsg("error", `JWT verification failed: ${jwtError.message}`);
      return callback(new Error("Invalid or expired token"), null);
    }
    const companyId = loginUserData.company_id;
    const userId = loginUserData.userId || loginUserData.id;

    if (!companyId) {
      return callback(new Error("Company ID not found in token"));
    }

    const { total_payable, type, slot, itemId } = data;

    // Validate total_payable - now accepts 0
    if (total_payable === undefined || total_payable === null) {
      return callback(new Error("Total payable amount is required"));
    }

    if (total_payable < 0) {
      return callback(new Error("Total payable amount cannot be negative"));
    }

    // Validate the item exists based on type
    let itemExists = false;
    let itemDetails: any = null;

    if (type === "package") {
      itemDetails = await EventPackageSchema.findById(itemId);
      if (!itemDetails) {
        return callback(new Error("Package not found"));
      }
      itemExists = true;
    } else if (type === "ticket") {
      itemDetails = await ticketSchema.findById(itemId);
      if (!itemDetails) {
        return callback(new Error("Ticket not found"));
      }
      itemExists = true;
    }

    if (!itemExists) {
      return callback(new Error("Invalid item reference"));
    }

    // Generate unique transaction number
    let transactionNumber = generateTransactionNumber();

    let existingTransaction = await PaymentHistory.findOne({
      transaction_number: transactionNumber,
    });

    while (existingTransaction) {
      transactionNumber = generateTransactionNumber();
      existingTransaction = await PaymentHistory.findOne({
        transaction_number: transactionNumber,
      });
    }

    // Prepare payment history data
    const paymentData: any = {
      transaction_number: transactionNumber,
      companyId: companyId,
      userId: userId || null,
      total_payable: parseFloat(total_payable) || 0, // Accepts 0
      pay_method: "UPI",
      pay_status: "Completed",
      pay_mode: "Online",
      payment_date: new Date(),
      show: true,
    };

    // Add remarks for free items
    if (total_payable === 0) {
      paymentData.remarks = "Free registration - No payment required";
    }

    // Add package or ticket based on type with slot (number of tickets)
    if (type === "package") {
      paymentData.package = {
        packageId: itemId,
        slot: slot ? slot.toString() : "1", // Number of package slots
      };
    } else if (type === "ticket") {
      paymentData.individualTicket = {
        ticketId: itemId,
        slot: slot ? slot.toString() : "1", // Number of tickets purchased
      };
    }

    // Create new payment history
    const newPayment = new PaymentHistory(paymentData);
    const savedPayment = await newPayment.save();

    // Populate references for the response
    const populatedPayment = await PaymentHistory.findById(savedPayment._id)
      .populate("companyId", "name email")
      .populate("userId", "name email")
      .populate("package.packageId", "title package_total_price")
      .populate("individualTicket.ticketId", "title price");

    loggerMsg(
      "info",
      `Payment history created with transaction: ${transactionNumber}${
        total_payable === 0 ? " (Free)" : ""
      }`
    );

    callback(null, {
      paymentHistory: populatedPayment,
      message:
        total_payable === 0
          ? "Free registration completed successfully"
          : "Payment record created successfully. Please proceed with payment.",
    });
  } catch (error: any) {
    loggerMsg("error", `Error creating payment history: ${error.message}`);

    if (error.code === 11000) {
      return callback(
        new Error("Transaction number conflict. Please try again.")
      );
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(", ");
      return callback(new Error(messages));
    }

    callback(error, null);
  }
};

export const getAllPaymentHistoryModule = async (
  filters: any,
  token: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Verify token
    let loginUserData: any;
    try {
      loginUserData = verifyToken(token);
    } catch (jwtError: any) {
      loggerMsg("error", `JWT verification failed: ${jwtError.message}`);
      return callback(new Error("Invalid or expired token"), null);
    }

    const companyId = loginUserData.company_id;

    if (!companyId) {
      return callback(new Error("Company ID not found in token"));
    }

    const {
      page = 1,
      limit = 10,
      search,
      pay_status,
      pay_mode,
      startDate,
      endDate,
    } = filters;
    const query: any = { companyId: companyId, show: true };

    if (search) {
      query.transaction_number = { $regex: search, $options: "i" };
    }

    // Filter by payment status
    if (pay_status) {
      query.pay_status = pay_status;
    }

    // Filter by payment mode
    if (pay_mode) {
      query.pay_mode = pay_mode;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.payment_date = {};
      if (startDate) {
        query.payment_date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.payment_date.$lte = new Date(endDate);
      }
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get total count
    const totalCount = await PaymentHistory.countDocuments(query);

    // Fetch payment history
    const paymentHistory = await PaymentHistory.find(query)
      .populate("companyId", "name email")
      .populate("userId", "name email")
      .populate("package.packageId", "title package_total_price")
      .populate("individualTicket.ticketId", "title price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    callback(null, {
      paymentHistory,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    loggerMsg("error", `Error fetching payment history: ${error.message}`);
    callback(error, null);
  }
};

export const getPaymentHistoryByIdModule = async (
  paymentId: string,
  token: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Verify token
    let loginUserData: any;
    try {
      loginUserData = verifyToken(token);
    } catch (jwtError: any) {
      loggerMsg("error", `JWT verification failed: ${jwtError.message}`);
      return callback(new Error("Invalid or expired token"), null);
    }

    const companyId = loginUserData.company_id;

    if (!companyId) {
      return callback(new Error("Company ID not found in token"));
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return callback(new Error("Invalid payment history ID"));
    }

    // Fetch payment history
    const paymentHistory = await PaymentHistory.findOne({
      _id: paymentId,
      companyId: companyId,
      show: true,
    })
      .populate("companyId", "name email")
      .populate("userId", "name email phone")
      .populate("package.packageId", "title package_total_price description")
      .populate("individualTicket.ticketId", "title price description");

    if (!paymentHistory) {
      return callback(new Error("Payment history not found"));
    }

    callback(null, { paymentHistory });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error fetching payment history by ID: ${error.message}`
    );
    callback(error, null);
  }
};

/**
 * Update Payment History
 */
export const updatePaymentHistoryModule = async (
  paymentId: string,
  updateData: any,
  token: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Verify token
    let loginUserData: any;
    try {
      loginUserData = verifyToken(token);
    } catch (jwtError: any) {
      loggerMsg("error", `JWT verification failed: ${jwtError.message}`);
      return callback(new Error("Invalid or expired token"), null);
    }

    const companyId = loginUserData.company_id;

    if (!companyId) {
      return callback(new Error("Company ID not found in token"));
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return callback(new Error("Invalid payment history ID"));
    }

    // Check if payment exists
    const existingPayment = await PaymentHistory.findOne({
      _id: paymentId,
      companyId: companyId,
    });

    if (!existingPayment) {
      return callback(new Error("Payment history not found"));
    }

    // Restrict certain fields from being updated
    const restrictedFields = [
      "transaction_number",
      "companyId",
      "userId",
      "createdAt",
    ];
    restrictedFields.forEach((field) => delete updateData[field]);

    // If updating slot in package or ticket
    if (updateData.slot) {
      if (existingPayment.package && existingPayment.package.packageId) {
        updateData["package.slot"] = updateData.slot.toString();
      } else if (
        existingPayment.individualTicket &&
        existingPayment.individualTicket.ticketId
      ) {
        updateData["individualTicket.slot"] = updateData.slot.toString();
      }
      delete updateData.slot;
    }

    // Update payment history
    const updatedPayment = await PaymentHistory.findByIdAndUpdate(
      paymentId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("companyId", "name email")
      .populate("userId", "name email")
      .populate("package.packageId", "title package_total_price")
      .populate("individualTicket.ticketId", "title price");

    loggerMsg("info", `Payment history updated: ${paymentId}`);

    callback(null, {
      paymentHistory: updatedPayment,
      message: "Payment history updated successfully",
    });
  } catch (error: any) {
    loggerMsg("error", `Error updating payment history: ${error.message}`);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(", ");
      return callback(new Error(messages));
    }

    callback(error, null);
  }
};

/**
 * Delete Payment History (Soft Delete)
 */
export const deletePaymentHistoryModule = async (
  paymentId: string,
  token: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Verify token
    let loginUserData: any;
    try {
      loginUserData = verifyToken(token);
    } catch (jwtError: any) {
      loggerMsg("error", `JWT verification failed: ${jwtError.message}`);
      return callback(new Error("Invalid or expired token"), null);
    }

    const companyId = loginUserData.company_id;

    if (!companyId) {
      return callback(new Error("Company ID not found in token"));
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return callback(new Error("Invalid payment history ID"));
    }

    // Check if payment exists
    const existingPayment = await PaymentHistory.findOne({
      _id: paymentId,
      companyId: companyId,
    });

    if (!existingPayment) {
      return callback(new Error("Payment history not found"));
    }

    // Prevent deletion of completed payments
    if (existingPayment.pay_status === "Completed") {
      return callback(
        new Error("Cannot delete completed payment transactions")
      );
    }

    // Soft delete - set show to false
    const deletedPayment = await PaymentHistory.findByIdAndUpdate(
      paymentId,
      { $set: { show: false } },
      { new: true }
    );

    loggerMsg("info", `Payment history deleted (soft): ${paymentId}`);

    callback(null, {
      message: "Payment history deleted successfully",
      paymentHistory: deletedPayment,
    });
  } catch (error: any) {
    loggerMsg("error", `Error deleting payment history: ${error.message}`);
    callback(error, null);
  }
};
