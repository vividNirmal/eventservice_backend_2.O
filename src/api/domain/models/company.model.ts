

import { loggerMsg } from "../../lib/logger";
import companySchema from "../schema/company.schema";
import { env } from "../../../infrastructure/env";

interface companyData{
    company_name:string;
    address:string;
    gst_number:string;
    owner_name:string;
    email_one:string;
    email_two:string;
    subdomain:string;
    logo?:string;
    exhibitor_dashboard_banner?:String;
    attandess_dashboard_banner?:string;
}
interface companyLogo{
    company_id:string;
    logo?:string;
}

interface companyStatus{
    company_id:string;
    status:number;
}

const addImageUrls = (company: any) => {
  const baseUrl = env.BASE_URL;
  if (company) {
    if (company.logo) {
      company.logo = `${baseUrl}/uploads/${company.logo}`;
    }
    if (company.attandess_dashboard_banner) {
      company.attandess_dashboard_banner = `${baseUrl}/uploads/${company.attandess_dashboard_banner}`;
    }
    if (company.exhibitor_dashboard_banner) {
      company.exhibitor_dashboard_banner = `${baseUrl}/uploads/${company.exhibitor_dashboard_banner}`;
    }
  }
  return company;
};



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
            exhibitor_dashboard_banner : companyData.exhibitor_dashboard_banner ? companyData.exhibitor_dashboard_banner :"",
            attandess_dashboard_banner : companyData.attandess_dashboard_banner ? companyData.attandess_dashboard_banner : ""
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
        // console.log("companyData.company_name",companyData.company_name);
        // Find the company by ID and update
        const baseUrl = env.BASE_URL;
        let updatedCompany = await companySchema.findByIdAndUpdate(
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
                    logo: companyData.logo,
                    exhibitor_dashboard_banner : companyData.exhibitor_dashboard_banner ,
                    attandess_dashboard_banner : companyData.attandess_dashboard_banner 
                },
            },
            { new: true } 
        );

        if (!updatedCompany) {
            return callback(new Error("Company not found"), null);
        }
        if(updatedCompany.exhibitor_dashboard_banner){
            updatedCompany.exhibitor_dashboard_banner = `${baseUrl}/uploads/${updatedCompany.exhibitor_dashboard_banner}`
        }
         if(updatedCompany.attandess_dashboard_banner){
            updatedCompany.attandess_dashboard_banner = `${baseUrl}/uploads/${updatedCompany.attandess_dashboard_banner}`
        }
        return callback(null, { updatedCompany });
    } catch (error) {
        console.error("Error updating company:", error);
        return callback(error, null);
    }
};

export const updateCompanyLogoModel = async (
  companyId: string,
  companyData: any,
  callback: (error: any, result: any) => void
) => {
  try {
    const updateData: any = {};
    
    // Only update the fields that are provided
    if (companyData.logo) updateData.logo = companyData.logo;
    if (companyData.exhibitor_dashboard_banner) updateData.exhibitor_dashboard_banner = companyData.exhibitor_dashboard_banner;
    if (companyData.attandess_dashboard_banner) updateData.attandess_dashboard_banner = companyData.attandess_dashboard_banner;

    const updatedCompany = await companySchema.findByIdAndUpdate(
      companyId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedCompany) {
      return callback(new Error("Company not found"), null);
    }

    // Add full URLs to the response
    const companyWithUrls = addImageUrls(updatedCompany.toObject());

    return callback(null, { updatedCompany: companyWithUrls });
  } catch (error) {
    console.error("Error updating company logo:", error);
    return callback(error, null);
  }
};

export const getCompanyImagesModel = async (
  companyId: string,
  callback: (error: any, result: any) => void
) => {
  try {
    const company = await companySchema.findById(companyId)
      .select('logo exhibitor_dashboard_banner attandess_dashboard_banner company_name');

    if (!company) {
      return callback(new Error("Company not found"), null);
    }

    // Add full URLs to the images
    const companyWithUrls = addImageUrls(company.toObject());

    const images = {
      logo: companyWithUrls.logo || null,
      exhibitor_dashboard_banner: companyWithUrls.exhibitor_dashboard_banner || null,
      attandess_dashboard_banner: companyWithUrls.attandess_dashboard_banner || null,
      company_name: companyWithUrls.company_name
    };

    return callback(null, { images });
  } catch (error) {
    console.error("Error fetching company images:", error);
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
        // console.log(companies);
       
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