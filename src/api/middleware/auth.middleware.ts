import { Request, Response, NextFunction } from "express";
// import { AuthService } from "../services/auth.service";
import { env } from "../../infrastructure/env";
import jwt from 'jsonwebtoken'
import companySchema from "../domain/schema/company.schema";
import userSchema from "../domain/schema/user.schema";

declare global {
    namespace Express {
        interface Request {
            user?: any;  // Use `any` or replace with the correct type for `user`
        }
    }
}

// export const validateAuth = async (req: Request, res: Response, next: NextFunction) => {
//     const token = req.header("Authorization")?.split(" ")[1];

//     if (!token) {
//         return res.status(400).json({
//             status: "error",
//             code: "AUTH_TOKEN_MISSING",
//             message: "Authentication token is missing. Please log in to continue."
//         });
//     }

//     try {
//         const payload = await AuthService.verifyToken(token);
//         req.user = payload;
//         next();
//     } catch (error) {
//         // Token is invalid or expired
//         return res.status(403).json({
//             status: "error",
//             code: "AUTH_TOKEN_EXPIRED",
//             message: "Your session has expired. Please log in again."
//         });
//     }
// };

// export const validateAuthNoAuth = async (req: Request, res: Response, next: NextFunction) => {
//     const token = req.header("Authorization")?.split(" ")[1];

//     if (!token) {
//         next();
//     } else {
//         try {
//             const payload = await AuthService.verifyToken(token);
//             req.user = payload;
//             next();
//         } catch (error) {
//             // Token is invalid or expired
//             next();
//         }
//     }
// };


export const protectedRoute = async(req:Request, res:Response, next: NextFunction) =>{
    let token;
    let message = 'Not authorized to access this route.';
    let msg = 'The user belonging to this token does not exist.';

    // check header for authorization
    if (req.headers.authorization) {
        
        if (req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        else {
            token = req.headers.authorization;
        }
    }

    if (!token) {
        res.status(401).json({ message: message });
        return
    }

    try {
        const decoded = jwt.verify(token,  process.env.JWT_SECRET_KEY || "defaultsecretkey"  as string);
        req.user = decoded;

        /////////////////////
        // Check if it's an event user (has userType in token)
        if (req.user.userType) {
            // This is an event user - check company status
            const company = await companySchema.findById(req.user.company_id);
            if (!company || company.status === 0) {
                return res.status(403).json({ 
                    message: "Company is inactive. Contact admin." 
                });
            }
        } else {
            // This is a regular user or admin
            if (req.user.role !== 'superadmin') {
                // For regular users, check user status and company status
                const user = await userSchema.findById(req.user.userId);
                if (!user || user.status === 0) {
                    return res.status(403).json({ 
                        message: "User is inactive. Contact admin." 
                    });
                }

                // Check company status for non-superadmin users
                const company = await companySchema.findById(req.user.company_id);
                if (!company || company.status === 0) {
                    return res.status(403).json({ 
                        message: "Company is inactive. Contact admin." 
                    });
                }

                // Additional check: verify user still belongs to the same company
                if (user.company_id !== req.user.company_id) {
                    return res.status(403).json({ 
                        message: "User company has been changed. Please login again." 
                    });
                }
            } else {
                // For superadmin, just check if user exists and is active
                const user = await userSchema.findById(req.user.userId);
                if (!user || user.status === 0) {
                    return res.status(403).json({ 
                        message: "User is inactive." 
                    });
                }
            }
        }
        /////////////////////
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid or expired token" })
    }
}

export const checkAdmin = async(req:Request, res:Response, next: NextFunction) =>{
    let token;
    let message = 'Not authorized to access this route.';
    // check header for authorization
    if (req.headers.authorization) {
        if (req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        else {
            token = req.headers.authorization;
        }
    }

    if (!token) {
        res.status(401).json({ message: message });
        return
    }
    try {
        const decoded = jwt.verify(token,  process.env.JWT_SECRET_KEY || "defaultsecretkey"  as string);
        req.user = decoded;
        if(req.user.role !== 'admin' && req.user.role !== 'superadmin'){
            return res.status(403).json({ message: "You do not have permission to access this route" });
        }
        next()
    } catch (error) {
        res.status(403).json({ message: "Invalid or expired token" })
    }
}