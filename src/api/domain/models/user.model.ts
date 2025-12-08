import userSchema from "../schema/user.schema";
import companySchema from "../schema/company.schema";
import Scannermachine from "../schema/scannerMachine.schema";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import scannerTokenSchema from "../schema/scannerToken.schema";
import { env } from "process";
import eventUserSchema from "../schema/eventUser.schema";
import { loggerMsg } from "../../lib/logger";
import { EmailService } from "../../services/sendEmail.service";

interface userData {
  email: string;
  password: string;
  name: string;
  profilePicture: string;
  role: string;
  status: boolean;
  company_id?: string;
}

interface UpdateUserData {
  email: string;
  password: string;
  name: string;
  profilePicture: string;
  role: string;
  status: boolean;
  user_id: string;
  company_id?: string;
}

interface userLoginData {
  email: string;
  password: string;
  subdomain: string;
  company_id?: string;
}

interface loginUserData {
  user_id: string;
  company_id: string;
  role : string;
}

interface userStatus {
  user_id: string;
  status: number;
}

interface scannerUserLoginData {
  email: string;
  password: string;
  machine_id: string;
  type: string;
  subdomain: string;
}

export const updateStatus = async (
  userStatus: userStatus,
  callback: (error: any, result: any) => void
) => {
  try {
    const user_id = userStatus.user_id;
    const updatedCompany = await userSchema.findByIdAndUpdate(
      user_id,
      {
        $set: {
          status: userStatus.status,
        },
      },
      { new: true }
    );

    if (!updatedCompany) {
      return callback(new Error("Company not found"), null);
    }

    return callback(null, { updatedCompany });
  } catch (error) {
    return callback(error, null);
  }
};

export const userLogin = async (
  userData: userLoginData,
  callback: (error: any, result: any) => void
) => {
  try {
    const user = await userSchema.findOne({
      email: { $regex: new RegExp(`^${userData.email}$`, "i") },
    });
    const baseUrl = env.BASE_URL;
    let registeruser: any = await eventUserSchema
      .findOne({
        email: userData.email,
      })
      .populate("compayId")
      .populate({
        path: "userType",
        select: "typeName", // specify fields you want from UserType
      });
    if (!user && !registeruser) {
      const error = new Error("User not found with this email.");
      return callback(error, null);
    }
    if (registeruser?.compayId && registeruser?.compayId.logo) {
      registeruser.compayId.logo = `${baseUrl}/${registeruser.compayId.logo}`;
    }
    if (
      registeruser?.compayId &&
      registeruser?.compayId.attandess_dashboard_banner
    ) {
      registeruser.compayId.attandess_dashboard_banner = `${baseUrl}/${registeruser.compayId.attandess_dashboard_banner}`;
    }
    if (
      registeruser?.compayId &&
      registeruser?.compayId.exhibitor_dashboard_banner
    ) {
      registeruser.compayId.exhibitor_dashboard_banner = `${baseUrl}/${registeruser.compayId.exhibitor_dashboard_banner}`;
    }
    if (
      registeruser?.compayId &&
      registeruser?.compayId?.company_login_banner
    ) {
      registeruser.compayId.company_login_banner = `${baseUrl}/${registeruser.compayId.company_login_banner}`;
    }
    if (registeruser) {
      const subdomain = userData.subdomain;
      const company_details: any = await companySchema.findOne({ subdomain });
      if (
        company_details._id.toString() !== registeruser.compayId._id.toString()
      ) {
        const error = new Error("You're not registered in this company");
        return callback(error, null);
      }
      if (company_details.status === 0) {
        const error = new Error("Company is inactive. Contact admin.");
        return callback(error, null);
      }
      const isPasswordCorrect = registeruser.password == userData.password;
      if (!isPasswordCorrect) {
        const error = new Error("Incorrect password.");
        return callback(error, null);
      }
      const token = jwt.sign(
        {
          userId: registeruser._id,
          email: registeruser.email,
          company_id: company_details.id,
          userType: registeruser.userType,
        },
        process.env.JWT_SECRET_KEY || "defaultsecretkey",
        { expiresIn: "8h" }
      );
      const result = {
        message: "Login successful",
        registeruser,
        company_details,
        token: token,
      };

      return callback(null, result);
    }
    
    if (user) {
      if (user.role == "superadmin" && userData.subdomain == 'admin') {
        const isPasswordCorrect = await bcrypt.compare(
          userData.password,
          user.password
        );
        if (!isPasswordCorrect) {
          const error = new Error("Incorrect password.");
          return callback(error, null);
        }

        const token = jwt.sign(
          {
            userId: user._id,
            email: user.email,
            name: user.name,
            company_id: "0",
            role: user.role,
          },
          process.env.JWT_SECRET_KEY || "defaultsecretkey",
          { expiresIn: "8h" }
        );

        const result = {
          message: "Login successful",
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
          },
          token: token,
          user_role: "superadmin",
        };
        return callback(null, result);
      } else {
        const company_name = userData.subdomain;
        const subdomain = userData.subdomain;
        const company_details = await companySchema.findOne({ subdomain });

        if (!company_details) {
          const error = new Error("Company not found.");
          return callback(error, null);
        }
        if (user.role == "superadmin") {
          const error = new Error("you don't have access ");
          return callback(error, null);
        }
        const baseUrl = env.BASE_URL;
        if (company_details.logo) {
          company_details.logo = baseUrl + "/" + company_details.logo;
        }
        if (company_details.status === 0) {
          const error = new Error("Company is inactive. Contact admin.");
          return callback(error, null);
        }

        if (user.status === 0) {
          const error = new Error("User is inactive. Contact admin.");
          return callback(error, null);
        }
        if (company_details.id != user.company_id) {
          const error = new Error(
            "You dont have access to login in this admin panel"
          );
          return callback(error, null);
        }

        const isPasswordCorrect = await bcrypt.compare(
          userData.password,
          user.password
        );
        if (!isPasswordCorrect) {
          const error = new Error("Incorrect password.");
          return callback(error, null);
        }

        const token = jwt.sign(
          {
            userId: user._id,
            email: user.email,
            name: user.name,
            company_id: company_details.id,
            role: user.role,
          },
          process.env.JWT_SECRET_KEY || "defaultsecretkey",
          { expiresIn: "8h" }
        );

        const result = {
          message: "Login successful",
          user,
          company_details,
          token: token,
          user_role: user.role,
        };

        return callback(null, result);
      }
    }
  } catch (error) {
    return callback(error, null);
  }
};

export const scannerLogin = async (
  userData: scannerUserLoginData,
  callback: (error: any, result: any) => void
) => {
  try {
    const subdomain = userData.subdomain;
    const company_details = await companySchema.findOne({ subdomain });

    if (!company_details) {
      const error = new Error("Company not Found");
      return callback(error, null);
    }
    if (company_details.status === 0) {
      const error = new Error(
        "This Company Blocked By Admin Plese contact to admin"
      );
      return callback(error, null);
    }

    const machine_id = userData.machine_id;
    const objectId = mongoose.Types.ObjectId.isValid(machine_id)
      ? new mongoose.Types.ObjectId(machine_id)
      : null;

    if (!objectId) {
      return callback(new Error("Invalid machine ID format."), null);
    }
    const machine_details = await Scannermachine.findById({ _id: objectId });
    if (!machine_details) {
      return callback(
        new Error("Machine is not assigned to this company."),
        null
      );
    }

    if (company_details?.id != machine_details.company_id) {
      const error = new Error(
        "You dont have access to login in this admin panel"
      );
      return callback(error, null);
    }

    if (typeof machine_details.expired_date === "string") {
      machine_details.expired_date = new Date(machine_details.expired_date);
    }

    if (machine_details.expired_date < new Date()) {
      return callback(
        new Error(
          "Machine validity has expired. Please contact the administrator."
        ),
        null
      );
    }

    const isPasswordCorrect = await bcrypt.compare(
      userData.password,
      machine_details.password
    );
    if (!isPasswordCorrect) {
      const error = new Error("Incorrect password.");
      return callback(error, null);
    }

    const token = jwt.sign(
      { machine_id: userData.machine_id, type: userData.type },
      process.env.JWT_SECRET_KEY || "defaultsecretkey",
      { expiresIn: "24h" }
    );

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h in milliseconds

    //Save token to DB
    await scannerTokenSchema.create({
      machine_id,
      token,
      expiresAt,
    });

    const result = {
      message: "Login successful",
      machine_details: machine_details,
      token: token,
    };
    return callback(null, result);
  } catch (error) {
    return callback(error, null);
  }
};

export const storeUser = async (
  loginuserData: loginUserData,
  userData: userData,
  callback: (error: any, result: any) => void
) => {
  try {
    const existingUser = await userSchema.findOne({ email: userData.email });
    if (existingUser) {
      loggerMsg("error", `User with this email already exists.`);
      const error = new Error("User with this email already exists.");
      return callback(error, null);
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = new userSchema({
      name: userData.name,
      email: userData.email,
      company_id: userData.company_id
        ? userData.company_id
        : loginuserData.company_id,
      password: hashedPassword,
      profilePicture: userData.profilePicture,
      status: "1",
      role: userData.role,
    });

    const savedUser = await newUser.save();
    return callback(null, newUser);
  } catch (error) {
    return callback(error, null);
  }
};

export const adminUserList = async (
  loginuserData: loginUserData,
  userData: userLoginData,
  page: number,
  pageSize: number,
  searchQuery: string,
  callback: (error: any, result: any) => void
) => {
  try {
    const currentPage = page || 1;
    const size = pageSize || 10;

    const skip = (currentPage - 1) * size;    

    if (loginuserData.company_id != "0" && loginuserData.role !== "superadmin") {
      const searchFilter = searchQuery
        ? {
            $or: [
              { name: { $regex: searchQuery, $options: "i" } },
              { email: { $regex: searchQuery, $options: "i" } },
            ],
            company_id: loginuserData.company_id,
          }
        : { company_id: loginuserData.company_id };

      const users = await userSchema.find(searchFilter).skip(skip).limit(size);
      const totalUsers = await userSchema.countDocuments(searchFilter);
      const result = {
        currentPage: currentPage,
        totalPages: Math.ceil(totalUsers / size),
        totalUsers: totalUsers,
        users: users,
      };
      return callback(null, result);
    } else {
      const searchFilter: any = {};

      if (searchQuery) {
        searchFilter.$or = [
          { name: { $regex: searchQuery, $options: "i" } },
          { email: { $regex: searchQuery, $options: "i" } },
        ];
      }

      if (userData.company_id != null) {
        searchFilter.company_id = userData.company_id;
      }

      const users = await userSchema.find(searchFilter).skip(skip).limit(size);
      const totalUsers = await userSchema.countDocuments(searchFilter);
      const result = {
        currentPage: currentPage,
        totalPages: Math.ceil(totalUsers / size),
        totalUsers: totalUsers,
        users: users,
      };
      return callback(null, result);
    }
  } catch (error) {
    return callback(error, null);
  }
};

export const updateUser = async (
  userData: UpdateUserData,
  callback: (error: any, result: any) => void
) => {
  try {
    const existingUser = await userSchema.findById(userData.user_id);
    if (!existingUser) {
      const error = new Error("User not found.");
      return callback(error, null);
    }

    if (userData.email && userData.email !== existingUser.email) {
      const emailTaken = await userSchema.findOne({ email: userData.email });
      if (emailTaken) {
        const error = new Error("User with this email already exists.");
        return callback(error, null);
      }
    }
    existingUser.name = userData.name || existingUser.name;
    existingUser.email = userData.email || existingUser.email;
    existingUser.profilePicture = existingUser.profilePicture =
      userData.profilePicture || existingUser.profilePicture;
    existingUser.role = userData.role || existingUser.role;
    existingUser.company_id = userData.company_id || existingUser.company_id;

    if (userData.password && userData.password !== "") {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      existingUser.password = hashedPassword;
      const htmlContent = PasswordChangeEmail({
        name: existingUser.name,
        email: existingUser.email,
        password: existingUser.password,
        year: new Date().getFullYear(),
      });
      const emailField = existingUser.email;

      try {
        await EmailService.sendEmail(emailField, "Your Event ID!", htmlContent);
      } catch (emailError) {
        console.log("❌ Password Email sending failed:", emailError);
        // Don't throw error - email failure shouldn't affect participant creation
      }
    }

    const updatedUser = await existingUser.save();
    return callback(null, updatedUser);
  } catch (error) {
    return callback(error, null);
  }
};

export const passwordChange = async (
  userData: UpdateUserData,
  callback: (error: any, result: any) => void
) => {
  try {
    const existingUser = await userSchema.findById(userData.user_id);
    if (!existingUser) {
      const error = new Error("User not found.");
      return callback(error, null);
    }
    if (userData.password && userData.password !== "") {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      existingUser.password = hashedPassword;
      const htmlContent = PasswordChangeEmail({
        name: existingUser.name,
        email: existingUser.email,
        password: userData.password,
        year: new Date().getFullYear(),
      });
      const emailField = existingUser.email;

      try {
        await EmailService.sendEmail(emailField, "Your Event ID!", htmlContent);
      } catch (emailError) {
        console.log("❌ Password Email sending failed:", emailError);
        // Don't throw error - email failure shouldn't affect participant creation
      }
    }

    const updatedUser = await existingUser.save();
    return callback(null, updatedUser);
  } catch (error) {
    return callback(error, null);
  }
};

const PasswordChangeEmail = (params: {
  name: string;
  email: string;
  password: string;
  year: number;
}) => {
  const { name, email, password, year } = params;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <title>Password Changed</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f8f9fb;
    }
  </style>
</head>

<body>
  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" >
    <tr>
      <td align="center">
        
        <!-- Main container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
          
          <!-- Header section with solid color -->
          <tr>
            <td style="background:#2563eb; padding:48px 40px; text-align:center; border-radius:12px 12px 0 0;">
              <div style="font-size:28px; font-weight:700; color:#ffffff; margin-bottom:8px; letter-spacing:-0.5px;">
                ✓ Password Updated
              </div>
              <div style="font-size:14px; color:#dbeafe; font-weight:500;">
                Your account is secure
              </div>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="background:#ffffff; padding:40px; border-radius:0 0 12px 12px; box-shadow:0 10px 25px rgba(0,0,0,0.08);">
              
              <!-- Greeting -->
              <div style="font-size:16px; color:#1f2937; line-height:1.6; margin-bottom:28px;">
                Hi <strong style="font-weight:700; color:#1e3a8a;">${name}</strong>,
              </div>

              <div style="font-size:15px; color:#4b5563; line-height:1.8; margin-bottom:28px;">
                Your password has been successfully changed. Your account is now secured with your new password.
              </div>

              <!-- Account details card -->
              <div style="background:#f8fafc; border-left:4px solid #2563eb; padding:20px; margin-bottom:28px; border-radius:6px;">
                <div style="margin-bottom:16px;">
                  <div style="font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">
                    Account Email
                  </div>
                  <div style="font-size:15px; color:#1f2937; word-break:break-all;">
                    ${email}
                  </div>
                </div>
                <div>
                  <div style="font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">
                    New Password
                  </div>
                  <div style="font-size:15px; color:#1f2937; font-family:monospace; background:#ffffff; padding:8px 12px; border-radius:4px; border:1px solid #e2e8f0;">
                    ${password}
                  </div>
                </div>
              </div>

              <!-- Security tip -->
              <div style="background:#f0fdf4; border-left:4px solid #16a34a; padding:16px; border-radius:6px; margin-bottom:28px;">
                <div style="font-size:13px; color:#15803d; font-weight:600; margin-bottom:4px;">
                  💡 Security Tip
                </div>
                <div style="font-size:13px; color:#166534; line-height:1.6;">
                  Keep your password confidential and never share it with anyone. Example App will never ask for your password via email.
                </div>
              </div>

              <!-- Call to action -->
              <div style="text-align:center; margin-bottom:28px;">
                <a href="#" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 32px; border-radius:6px; font-size:15px; font-weight:600; transition:background 0.2s ease;">
                  Go to Account
                </a>
              </div>

              <!-- Divider -->
              <div style="border-top:1px solid #e5e7eb; margin-bottom:28px;"></div>

              <!-- Additional info -->
              <div style="font-size:13px; color:#6b7280; line-height:1.8;">
                <p style="margin:0 0 8px 0;">
                  If you didn't make this change or need help securing your account, please contact our support team immediately.
                </p>
                <p style="margin:0;">
                  <a href="#" style="color:#2563eb; text-decoration:underline;">Contact Support</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:24px 40px; text-align:center; border-radius:0 0 8px 8px; border-top:1px solid #e5e7eb;">
              <div style="font-size:12px; color:#9ca3af; line-height:1.6;">
                <p style="margin:0 0 8px 0;">
                  © ${year} Example App. All rights reserved.
                </p>
                <p style="margin:0; color:#d1d5db;">
                  This is an automated security notification. Please do not reply to this email.
                </p>
              </div>
            </td>
          </tr>

        </table>
        <!-- End container -->

      </td>
    </tr>
  </table>

</body>
</html>
`;
};

export default PasswordChangeEmail;
