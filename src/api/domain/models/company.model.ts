import mongoose from "mongoose";
import { convertToSlug } from "../../helper/helper";
import { loggerMsg } from "../../lib/logger";
import companySchema from "../schema/company.schema";
import { env } from "../../../infrastructure/env";
import { inflate } from "zlib";

interface companyData{
    company_name:string;
    address:string;
    gst_number:string;
    owner_name:string;
    email_one:string;
    email_two:string;
    subdomain:string;
    logo?:string;
}
interface companyLogo{
    company_id:string;
    logo?:string;
}

interface companyStatus{
    company_id:string;
    status:number;
}


export const updateStatus = async (companyStatus: companyStatus, callback: (error: any, result: any) => void) => {
    try {
        const company_id = companyStatus.company_id
        const updatedCompany = await companySchema.findByIdAndUpdate(
            company_id,
            {
                $set: {
                    status: companyStatus.status,
                },
            },
            { new: true } 
        );

        if (!updatedCompany) {
            return callback(new Error("Company not found"), null);
        }

        return callback(null, { updatedCompany });

    } catch (error) {
        console.error("Error during event creation:", error);
        loggerMsg("error", `Error during event creation: ${error}`);
        return callback(error, null); 
    }
};

export const storeCompany = async (companyData: companyData, callback: (error: any, result: any) => void) => {
    try {
        
        const newCompany = new companySchema({
            company_name:companyData.company_name,
            address:companyData.address,
            gst_number:companyData.gst_number,
            owner_name:companyData.owner_name,
            email_one:companyData.email_one,
            email_two:companyData.email_two,
            subdomain:companyData.subdomain,
            status:1,
            logo: companyData.logo ? companyData.logo : "",
        });

        const savedCompany= await newCompany.save();

        return callback(null, { savedCompany,  });
    } catch (error) {
        console.error("Error during event creation:", error);
        loggerMsg("error", `Error during event creation: ${error}`);
        return callback(error, null); 
    }
};

export const updateCompany = async (
    companyId: string,
    companyData: companyData,
    callback: (error: any, result: any) => void
) => {
    try {
        console.log("companyData.company_name",companyData.company_name);
        // Find the company by ID and update
        const updatedCompany = await companySchema.findByIdAndUpdate(
            companyId,
            {
                $set: {
                    company_name: companyData.company_name,
                    address: companyData.address,
                    gst_number: companyData.gst_number,
                    owner_name: companyData.owner_name,
                    email_one: companyData.email_one,
                    email_two: companyData.email_two,
                    subdomain: companyData.subdomain,
                    logo: companyData.logo
                },
            },
            { new: true } 
        );

        if (!updatedCompany) {
            return callback(new Error("Company not found"), null);
        }

        return callback(null, { updatedCompany });
    } catch (error) {
        console.error("Error updating company:", error);
        return callback(error, null);
    }
};

export const updateCompanyLogoModel = async (
    companyId: string,
    companyData: companyLogo,
    callback: (error: any, result: any) => void
) => {
    try {
        console.log("companyData.logo",companyData.logo);
        // Find the company by ID and update
        const updatedCompany = await companySchema.findByIdAndUpdate(
            companyId,
            {
                $set: {
                    logo: companyData.logo
                },
            },
            { new: true } 
        );

        if (!updatedCompany) {
            return callback(new Error("Company not found"), null);
        }

        return callback(null, { updatedCompany });
    } catch (error) {
        console.error("Error updating company logo:", error);
        return callback(error, null);
    }
};

export const companyList = async (companyData: companyData, page: number, pageSize: number, searchQuery: string, callback: (error: any, result: any) => void) => {
    try {

        const currentPage = page || 1;
        const size = pageSize || 10;

        const skip = (currentPage - 1) * size;

        const searchFilter = searchQuery
            ? {
                  $or: [
                      { company_name: { $regex: searchQuery, $options: 'i' } }, 
                      { address: { $regex: searchQuery, $options: 'i' } }, 
                      { gst_number: { $regex: searchQuery, $options: 'i' } }, 
                      { email_one: { $regex: searchQuery, $options: 'i' } }, 
                      { subdomain: { $regex: searchQuery, $options: 'i' } },
                  ]
              }
            : {}; 

        const companies = await companySchema.find(searchFilter).skip(skip).limit(size);
        console.log(companies);
       
        const totalCompany = await companySchema.countDocuments(searchFilter); 
        const result = {
            currentPage: currentPage,
            totalPages: Math.ceil(totalCompany / size),
            totalUsers: totalCompany,
            company: companies,
        };

        return callback(null, result);
    } catch (error) {
        console.error("Error fetching user list:", error);
        return callback(error, null);
    }
}