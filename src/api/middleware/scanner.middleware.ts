import { Request, Response, NextFunction } from "express";
// import { AuthService } from "../services/auth.service";
import { env } from "../../infrastructure/env";
import jwt from 'jsonwebtoken'
import scannerTokenSchema from "../domain/schema/scannerToken.schema";

export const verifyScannerToken = async(req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || 'defaultsecretkey') as { machine_id: string };

    const tokenInDb = await scannerTokenSchema.findOne({ token });

    if (!tokenInDb) {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }
    // Attach to req object so it can be used in route handlers
    (req as any).machine_id = decoded.machine_id;
    (req as any).token = token;

    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};