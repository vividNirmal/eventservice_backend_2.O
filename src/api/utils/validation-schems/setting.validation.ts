import Joi from 'joi';

export const settingSchema = Joi.object({
    buttons: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          icon: Joi.string().required(),
          status: Joi.boolean().required(),
        })
      )
      .required()
      .messages({ "any.required": "Buttons array is required." }),
    });
    
