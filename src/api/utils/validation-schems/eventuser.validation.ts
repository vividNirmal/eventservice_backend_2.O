import Joi from "joi";

export const ExhibitordirectLoginSchema = Joi.object({
  type : Joi.string().required(),
  id : Joi.string().required(),

});