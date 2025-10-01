import { Request, Response } from "express";
import { Types } from 'mongoose';
import { successCreated, successResponse ,ErrorResponse } from "../../helper/apiResponse";
import scannermachineSchema from "../../domain/schema/scannerMachine.schema";
import { storeScannerMachineModel, updateScannerMachineModel ,scannerMachineList,assignScannerMachineModel} from "../../domain/models/scannerMachine.model";


export const storeScannerMachine = async (req: Request, res: Response) => {
    try {
        
        storeScannerMachineModel(req.body, (error:any, result:any) => {
            if (error) {
                return res.status(500).json({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error instanceof Error ? error.message : "An unexpected error occurred."
                });
            }
            return successCreated(res, result)
        });
    } catch (error) {
       
    }
};

export const getScannerMachineDetails = async (req: Request, res: Response) => {
    try {
        
        const { scanner_machine_id } = req.params;
        const scanner_machine_details = await scannermachineSchema.findById(scanner_machine_id);
        if (!scanner_machine_details) {
            return ErrorResponse(res, "User not found")
        }
        return successResponse(res, 'Get Admin User List',scanner_machine_details)
        
    } catch (error) {
       
    }
};

export const checkUniqueMachineId = async (req: Request, res: Response) => {
    try {
        const { machine_unique_id, id } = req.query; 

        if (!machine_unique_id) {
            return res.status(400).json({ success: false, message: 'machine_unique_id is required.' });
        }
       
          if (id && typeof id === 'string') {
            if (!Types.ObjectId.isValid(id)) {
                return ErrorResponse(res, 'Invalid user ID format.');
            }
        }

        let scannermachine;
        if (id && typeof id === 'string') {
            scannermachine = await scannermachineSchema.findOne({ scanner_unique_id: machine_unique_id, _id: { $ne: id } });
        } else {
            scannermachine = await scannermachineSchema.findOne({ scanner_unique_id: machine_unique_id });
        }

        if (scannermachine) {
            return res.status(409).json({ success: false, message: 'scannermachine is already in use.' });
        }

        return res.status(200).json({ success: true, message: 'scannermachine is available.' });
    } catch (error) {
        console.error('Error in checkEmailUser:', error);
        return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
};


export const updateScannerMachine = async (req: Request, res: Response) => {
    try {
        
        updateScannerMachineModel(req.body, (error:any, result:any) => {
            if (error) {
                return res.status(500).json({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error instanceof Error ? error.message : "An unexpected error occurred."
                });
            }
            return successCreated(res, result)
        });
    } catch (error) {
       
    }
};

export const deleteScannerMachine = async (req: Request, res: Response) => {
    try {
        
       const { scannerMachine_ids } = req.body; 
       
        if (!scannerMachine_ids || !Array.isArray(scannerMachine_ids) || scannerMachine_ids.length === 0) {
            return ErrorResponse(res, "Please provide at least one valid company ID.");
        }

        const result = await scannermachineSchema.deleteMany({ _id: { $in: scannerMachine_ids } });

        if (result.deletedCount === 0) {
            return ErrorResponse(res, "No company found with the provided IDs.");
        }

        return successResponse(res, `Successfully deleted  Scanner Machine(ies).`,result.deletedCount);
    } catch (error) {
       
    }
};

export const getScannerMachine = async (req: Request, res: Response) => {
    try {
            const { page = 1, pageSize = 10, searchQuery = "" } = req.query;
            scannerMachineList(req.body,
            parseInt(page as string),
            parseInt(pageSize as string),
            searchQuery as string, (error:any, result:any) => {
                if (error) {
                    return res.status(500).json({
                        code: "INTERNAL_SERVER_ERROR",
                        message: error instanceof Error ? error.message : "An unexpected error occurred."
                    });
                }
                return successResponse(res, 'Get Scanner Machine List List', 
                    result,
                )
            });

    } catch (error) {
        return ErrorResponse(res, "An error occurred during event retrieval.");
    }
}

export const assignScannerMachine = async (req: Request, res: Response) => {
    try {

        assignScannerMachineModel(req.body, (error:any, result:any) => {
            if (error) {
                return res.status(500).json({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error instanceof Error ? error.message : "An unexpected error occurred."
                });
            }
            return successCreated(res, result)
        });

    } catch (error) {
        return ErrorResponse(res, "An error occurred during event retrieval.");
    }
}

export const removeAssignScannerMachine = async (req: Request, res: Response) => {
    try {

        const { scannerMachine_ids } = req.body; 
       
        if (!scannerMachine_ids || !Array.isArray(scannerMachine_ids) || scannerMachine_ids.length === 0) {
            return ErrorResponse(res, "Please provide at least one valid company ID.");
        }

        const result = await scannermachineSchema.updateMany(
            { _id: { $in: scannerMachine_ids } }, 
            { $set: { company_id: null, expired_date: null ,password:null} } 
        );

        return successResponse(res, `Successfully deleted  Scanner Machine(ies).`,result.modifiedCount);

    } catch (error) {
        return ErrorResponse(res, "An error occurred during event retrieval.");
    }
}

export const getScannerMachinesByCompany = async (req: Request, res: Response) => {
    try {
        const { company_id } = req.params;
        const { page = 1, pageSize = 10, searchQuery = "" } = req.query;

        if (!company_id) {
            return ErrorResponse(res, "Company ID is required");
        }

        const currentPage = parseInt(page as string) || 1;
        const size = parseInt(pageSize as string) || 10;
        const skip = (currentPage - 1) * size;

        // Search filter for company-specific scanners
        const searchFilter: any = { 
            company_id: company_id,
            ...(searchQuery && {
                $or: [
                    { scanner_name: { $regex: searchQuery, $options: 'i' } }, 
                    { scanner_unique_id: { $regex: searchQuery, $options: 'i' } }, 
                ]
            })
        };

        // Get scanners assigned to this company
        const scanners = await scannermachineSchema.find(searchFilter)
            .skip(skip)
            .limit(size)
            .populate('company_id', 'company_name')
            .sort({ createdAt: -1 });

        const totalScanners = await scannermachineSchema.countDocuments(searchFilter);

        const formattedScanners = scanners.map(scanner => ({
            ...scanner.toObject(),
            company_name: scanner.company_id ? (scanner.company_id as any).company_name : "-",
            expired_date: scanner.expired_date || "-"
        }));

        const result = {
            currentPage: currentPage,
            totalPages: Math.ceil(totalScanners / size),
            totalUsers: totalScanners,
            scannermachine: formattedScanners,
        };

        return successResponse(res, 'Get Company Scanner List', result);

    } catch (error) {
        return ErrorResponse(res, "An error occurred during scanner retrieval.");
    }
}
