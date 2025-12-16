import { Request, Response } from "express";
import { successCreated, successResponse ,ErrorResponse } from "../../helper/apiResponse";
import countrySchema from "../../domain/schema/country.schema";
import stateSchema from "../../domain/schema/state.schema";
import citySchema from "../../domain/schema/city.schema";
import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { Collection } from "mongoose";


interface FileWithBuffer extends Express.Multer.File {
buffer: Buffer;
}

export const getCountry = async (req: Request, res: Response) => {
    try {
        
        const country = await countrySchema.find();    
        
        if (!country) {
            return ErrorResponse(res, "Countr not found");
        }

        return successResponse(res, 'Get Country List', {
            country,
        });
        
    } catch (error) {
        return ErrorResponse(res, "An error occurred during event retrieval.")
    }
};

export const getState = async (req: Request, res: Response) => {

    try {
        const { id } = req.params;
        console.log(id);
        const state = await stateSchema.find({ country_id: id });
        
        if (!state) {
            return ErrorResponse(res, "State not found");
        }

        return successResponse(res, 'Get State List', {
            state,
        });
        
    } catch (error) {
        return ErrorResponse(res, "An error occurred during event retrieval.")
    }
};

export const getCity = async (req: Request, res: Response) => {

    try {

        const { id } = req.params;

        const city = await citySchema.find({ state_id: id });
        
        if (!city) {
            return ErrorResponse(res, "City not found");
        }

        return successResponse(res, 'Get City List', {
            city,
        });
        
    } catch (error) {
        return ErrorResponse(res, "An error occurred during event retrieval.")
    }
};

export const importXlsxData = async (req: Request, res: Response) => {
    try {
        // Define file name & folder path
        const filename = "cities-list.xlsx";
        const folderPath = path.join(__dirname, "../../../uploads"); // Ensure this folder exists
        const filePath = path.join(folderPath, filename);

        console.log("Reading file from:", filePath);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: "File not found." });
        }

        // Read the Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheetData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Validate Excel format
        if (!sheetData.length || !sheetData[0].state || !sheetData[0].city) {
            return res.status(400).json({ success: false, message: "Invalid Excel format. Ensure columns are named 'State' and 'City'." });
        }

        // Country ID (static for now, update dynamically if needed)
        const country_id = "67610db09c6d81094c056ee4";
        var idsss = 1;
        // Process each row from Excel
        for (const row of sheetData) {
            console.log("statestatestatestate_data_type",idsss++);
            const stateName = row.state.trim();
            const cityName = row.city.trim();

            // Check if state exists
            let state = await stateSchema.findOne({ name: stateName, country_id });
            console.log("statestatestatestatestatestatestatestate",state);
            // If state does not exist, create it
            if (!state) {
                state = new stateSchema({ name: stateName, country_id });
                await state.save();
            }

            // Check if city exists under this state
            const existingCity = await citySchema.findOne({ name: cityName, state_id: state._id });
            console.log("existingCityexistingCityexistingCityexistingCityexistingCityexistingCity",existingCity)
            // If city does not exist, create it
            if (!existingCity) {
                await new citySchema({ name: cityName, state_id: state._id }).save();
            }
        }

        return successResponse(res, "States and cities imported successfully.","success");
    } catch (error) {
        console.error("Error importing data:", error);
        return ErrorResponse(res, "An error occurred while importing data.");
    }
};

export const getHomePageCity = async (req: Request, res: Response) => {
    try {
        // Fetch cities
        const countryId = "67610db09c6d81094c056ee4"; // Replace with actual India country _id

        // Fetch states where country_id matches India
        const states = await stateSchema.find({ country_id: countryId });

        // Check if no states were fo   und
        if (!states || states.length === 0) {
            return ErrorResponse(res, "No Indian states found");
        }

        // Extract state IDs from the fetched states
        const stateIds = states.map(state => state._id);
        // console.log(stateIds)
        // Fetch cities where state_id is in the extracted stateIds
        const cities = await citySchema.find({ state_id: { $in: stateIds } });
        
        if (!cities || cities.length === 0) {
            return ErrorResponse(res, "No cities found");
        }

        // Send success response with the city list
        return successResponse(res, 'Successfully retrieved city list', {
            cities,
        });
        
    } catch (error) {
        // Log the error for debugging purposes
        console.error("Error during city retrieval:", error);

        // Return an error response
        return ErrorResponse(res, "An error occurred during city retrieval.");
    }
};




