import mongoose from "mongoose";
import { convertToSlug } from "../../helper/helper";
import AdminCompanySchema from "../schema/adminCompany.schema";
import { env } from "process";
import { loggerMsg } from "../../lib/logger";

interface storeAdminCompanyData{
    like_to_visit: string;
    company_type: string;
    address_type: string;
    company_name: string;
    company_email: string;
    country_number: string;
    country_code: string;
    business_nature: string;
    address_one: string;
    address_two: string;
    pincode: string;
    country: string;
    city: string;
    company_document:string;
    company_website:string;
    company_id:string;
    objective_of_visiting:string;
    first_learn_about:string;
    product_dealing:string;
    admin_company_id?:string;
}

interface loginUserData{
    user_id:string;
    company_id:string;
}

export const storeAdminCompany = async (loginUser:loginUserData,storeAdminCompanyData: storeAdminCompanyData, callback: (error: any, result: any) => void) => {
    try {
        // console.log(loginUser);
        const newCompany = new AdminCompanySchema({
            like_to_visit:storeAdminCompanyData.like_to_visit,
            company_id:loginUser.company_id,
            company_type:storeAdminCompanyData.company_type,
            address_type:storeAdminCompanyData.address_type,
            company_name:storeAdminCompanyData.company_name,
            company_email:storeAdminCompanyData.company_email,
            country_number:storeAdminCompanyData.country_number,
            country_code:storeAdminCompanyData.country_code,
            business_nature:storeAdminCompanyData.business_nature,
            address_one:storeAdminCompanyData.address_one,
            address_two:storeAdminCompanyData.address_two,
            pincode:storeAdminCompanyData.pincode,
            country:storeAdminCompanyData.country,
            city:storeAdminCompanyData.city,
            company_document:storeAdminCompanyData.company_document,
            company_website:storeAdminCompanyData.company_website,
            objective_of_visiting:storeAdminCompanyData.objective_of_visiting,
            first_learn_about:storeAdminCompanyData.first_learn_about,
            product_dealing:storeAdminCompanyData.product_dealing,
        });

        const savedCompany= await newCompany.save();

        return callback(null, { savedCompany,  });
    } catch (error) {
        console.error("Error during event creation:", error);
        loggerMsg("error", `Error during event creation: ${error}`);
        return callback(error, null); 
    }
};

export const adminCompanyList = async (loginUserData:loginUserData,userData: storeAdminCompanyData, page: number, pageSize: number, searchQuery: string, callback: (error: any, result: any) => void) => {
    try {
        // console.log(loginUserData.company_id);
        const currentPage = page || 1;
        const size = pageSize || 10;

        const skip = (currentPage - 1) * size;

        const searchFilter = searchQuery
            ? {
                  $or: [
                      { company_name: { $regex: searchQuery, $options: 'i' } }, 
                      { address_one: { $regex: searchQuery, $options: 'i' } }, 
                      { company_email: { $regex: searchQuery, $options: 'i' } }, 
                      { country_number: { $regex: searchQuery, $options: 'i' } }, 
                    ],
                    company_id: loginUserData.company_id
                }
              : { company_id: loginUserData.company_id };

        const events = await AdminCompanySchema.find(searchFilter).skip(skip).limit(size);
        
        const eventswithimage = events.map(event => {
            return {
                ...event.toObject(), 
                company_document: `${env.BASE_URL}/${event.company_document}`,
            };
        });
        const totalUsers = await AdminCompanySchema.countDocuments(searchFilter); 
        const result = {
            currentPage: currentPage,
            totalPages: Math.ceil(totalUsers / size),
            totalUsers: totalUsers,
            companies: eventswithimage,
        };

        return callback(null, result);
    } catch (error) {
        return callback(error, null);
    }
}

export const updateAdminCompany = async (loginUser: loginUserData, storeAdminCompanyData: storeAdminCompanyData, callback: (error: any, result: any) => void) => {
    try {
        // console.log(loginUser);

        const updatedCompany = await AdminCompanySchema.findByIdAndUpdate(
            storeAdminCompanyData.admin_company_id,  
            {
                like_to_visit: storeAdminCompanyData.like_to_visit,
                company_id: loginUser.company_id,
                company_type: storeAdminCompanyData.company_type,
                address_type: storeAdminCompanyData.address_type,
                company_name: storeAdminCompanyData.company_name,
                company_email: storeAdminCompanyData.company_email,
                country_number: storeAdminCompanyData.country_number,
                country_code: storeAdminCompanyData.country_code,
                business_nature: storeAdminCompanyData.business_nature,
                address_one: storeAdminCompanyData.address_one,
                address_two: storeAdminCompanyData.address_two,
                pincode: storeAdminCompanyData.pincode,
                country: storeAdminCompanyData.country,
                city: storeAdminCompanyData.city,
                company_document: storeAdminCompanyData.company_document,  
                company_website: storeAdminCompanyData.company_website,
                objective_of_visiting:storeAdminCompanyData.objective_of_visiting,
                first_learn_about:storeAdminCompanyData.first_learn_about,
                product_dealing:storeAdminCompanyData.product_dealing,
            },
            { new: true }  
        );

        if (!updatedCompany) {
            return callback(new Error('Company not found'), null);
        }

        return callback(null, { updatedCompany });

    } catch (error) {
        console.error("Error during company update:", error);
        loggerMsg("error", `Error during company update: ${error}`);
        return callback(error, null);
    }
};

