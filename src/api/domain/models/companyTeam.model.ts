import mongoose from "mongoose";
import { convertToSlug } from "../../helper/helper";
import CompanyTeamSchema from "../schema/companyTeam.schema";
import { env } from "process";
import { loggerMsg } from "../../lib/logger";

interface storeAdminCompanyData{
    company_id: string;
    profile_picture: string;
    first_name: string;
    last_name: string;
    email: string;
    country_code: string;
    contact_no: string;
    ownership: string;
    birth_date: string;
    gender: string;
    address_one: string;
    address_two: string;
    pincode: string;
    country: string;
    city: string;
    passport_no: string;
    passport_image: string;
    valid_upto: string;
    origin: string;
    visa_recommendation: string;
    business_card: string;
    team_id?:string;
    admin_company_id:string;
}

interface loginUserData{
    user_id:string;
    company_id:string;
}

export const storeCompanyTeamModel = async (loginUser:loginUserData,storeAdminCompanyData: storeAdminCompanyData, callback: (error: any, result: any) => void) => {
    try {
        
        const newCompany = new CompanyTeamSchema({
            company_id: loginUser.company_id,
            profile_picture: storeAdminCompanyData.profile_picture,
            first_name: storeAdminCompanyData.first_name,
            last_name: storeAdminCompanyData.last_name,
            email: storeAdminCompanyData.email,
            country_code: storeAdminCompanyData.country_code,
            contact_no: storeAdminCompanyData.contact_no,
            ownership: storeAdminCompanyData.ownership,
            birth_date: storeAdminCompanyData.birth_date,
            gender: storeAdminCompanyData.gender,
            address_one: storeAdminCompanyData.address_one,
            address_two: storeAdminCompanyData.address_two,
            pincode: storeAdminCompanyData.pincode,
            country: storeAdminCompanyData.country,
            city: storeAdminCompanyData.city,
            passport_no: storeAdminCompanyData.passport_no,
            passport_image: storeAdminCompanyData.passport_image,
            valid_upto: storeAdminCompanyData.valid_upto,
            origin: storeAdminCompanyData.origin,
            visa_recommendation: storeAdminCompanyData.visa_recommendation,
            business_card: storeAdminCompanyData.business_card,
            admin_company_id:storeAdminCompanyData.admin_company_id,
        });

        const savedCompany= await newCompany.save();

        return callback(null, { savedCompany,  });
    } catch (error) {
        console.error("Error during event creation:", error);
        loggerMsg("error", `Error during event creation: ${error}`);
        return callback(error, null); 
    }
};

export const updateCompanyTeam = async (loginUser: loginUserData, storeAdminCompanyData: storeAdminCompanyData, callback: (error: any, result: any) => void) => {
    try {

        const updatedCompany = await CompanyTeamSchema.findByIdAndUpdate(
            storeAdminCompanyData.team_id,  
            {
                company_id: loginUser.company_id,
                profile_picture: storeAdminCompanyData.profile_picture,
                first_name: storeAdminCompanyData.first_name,
                last_name: storeAdminCompanyData.last_name,
                email: storeAdminCompanyData.email,
                country_code: storeAdminCompanyData.country_code,
                contact_no: storeAdminCompanyData.contact_no,
                ownership: storeAdminCompanyData.ownership,
                birth_date: storeAdminCompanyData.birth_date,
                gender: storeAdminCompanyData.gender,
                address_one: storeAdminCompanyData.address_one,
                address_two: storeAdminCompanyData.address_two,
                pincode: storeAdminCompanyData.pincode,
                country: storeAdminCompanyData.country,
                city: storeAdminCompanyData.city,
                passport_no: storeAdminCompanyData.passport_no,
                passport_image: storeAdminCompanyData.passport_image,
                valid_upto: storeAdminCompanyData.valid_upto,
                origin: storeAdminCompanyData.origin,
                visa_recommendation: storeAdminCompanyData.visa_recommendation,
                business_card: storeAdminCompanyData.business_card,
                admin_company_id:storeAdminCompanyData.admin_company_id,
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


export const companyTeamList = async (
    loginUserData: loginUserData,
    userData: storeAdminCompanyData,
    page: number,
    pageSize: number,
    searchQuery: string,
    user_type: string,
    search_origin: string,
    all_date: string,
    company_id:string,
    callback: (error: any, result: any) => void
) => {
    try {
       
    
        const currentPage = page || 1;
        const size = pageSize || 10;
        const skip = (currentPage - 1) * size;
    
        let searchFilter: any = { company_id: loginUserData.company_id };
    
        if (searchQuery) {
            const isValidObjectId = mongoose.Types.ObjectId.isValid(searchQuery);
            searchFilter.$and = [
                { company_id: loginUserData.company_id },
                {
                    $or: [
                        { first_name: { $regex: searchQuery, $options: "i" } },
                        { last_name: { $regex: searchQuery, $options: "i" } },
                        { email: { $regex: searchQuery, $options: "i" } },
                        { address: { $regex: searchQuery, $options: "i" } },
                        { contact_no: { $regex: searchQuery, $options: "i" } },
                        ...(isValidObjectId ? [{ _id: new mongoose.Types.ObjectId(searchQuery) }] : []), 
                    ],
                },
            ];
        }
    
        if (search_origin) {
            searchFilter.origin = search_origin; 
        }
    
        if (user_type) {
            searchFilter.user_type = user_type; 
        }
        console.log(company_id);
        if (company_id) {
            console.log(company_id);
            searchFilter.admin_company_id = company_id; 
        }
    
        if (all_date) {
            const date = new Date(all_date);
            if (!isNaN(date.getTime())) {
                searchFilter.createdAt = { $gte: date }; 
            }
        }
    
        const events = await CompanyTeamSchema.find(searchFilter)
            .populate("admin_company_id", "company_name")
            .skip(skip)
            .limit(size);
    
        const eventsWithImage = events.map(event => ({
            ...event.toObject(),
            business_card: `${env.BASE_URL}/${event.business_card}`,
            passport_image: `${env.BASE_URL}/${event.passport_image}`,
            profile_picture: `${env.BASE_URL}/${event.profile_picture}`,
        }));
    
        const totalUsers = await CompanyTeamSchema.countDocuments(searchFilter);
    
        const result = {
            currentPage,
            totalPages: Math.ceil(totalUsers / size),
            totalUsers,
            companies: eventsWithImage,
        };
    
        return callback(null, result);
    } catch (error) {
        return callback(error, null);
    }
    
};




