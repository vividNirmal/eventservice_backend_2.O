import { env } from "process";
import { RekognitionClient, IndexFacesCommand, SearchFacesByImageCommand ,CreateCollectionCommand  } from "@aws-sdk/client-rekognition";


const COLLECTION_ID =process.env.AWS_REKOGNITION_COLLECTION ||  "levenex_collection";
// const rekognition = new AWS.Rekognition();
const AWS_REGION = process.env.AWS_REGION || "";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "";
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";

const rekognition = new RekognitionClient({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

export const detectFace = async (imageBuffer: Buffer): Promise<string> => {
    try {
        const indexParams = {
            CollectionId: COLLECTION_ID,
            Image: { Bytes: imageBuffer }
        };

        const indexCommand = new IndexFacesCommand(indexParams);
        const indexResult = await rekognition.send(indexCommand);

        if (!indexResult.FaceRecords || indexResult.FaceRecords.length === 0) {
            throw new Error("No face detected or face indexing failed");
        }

        return indexResult?.FaceRecords[0]?.Face?.FaceId!; // Return the face ID

    } catch (error) {
        console.error("Error in detectFace:", error);
        throw error;
    }
};
