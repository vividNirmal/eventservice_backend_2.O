// validations/exhibitorFormAsset.validation.ts
import Joi from "joi";

export const upsertExhibitorFormAssetValidationSchema = Joi.object({
  id: Joi.string().optional(),
}).unknown(true);