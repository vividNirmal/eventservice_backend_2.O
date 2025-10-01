import Joi from 'joi';
export const blogValidation = Joi.object({
    blog_title: Joi.string().required().messages({
        "string.blog_title": "Please enter a valid Blog Name.",
        "any.required": "Blog Title is required."
    }),
    description: Joi.string().required().messages({
        "string.description": "Please enter a valid description.",
        "any.required": "Description is required."
    })
});


export const deleteEventBlog = Joi.object({
    blog_ids: Joi.array().required().messages({
        "any.required": "blog_ids is required."
    }),
});

export const homeBlogdetailsValidation = Joi.object({
    blog_slug: Joi.string().required().messages({
        "string.blog_slug": "Please enter a valid Blog Slug.",
        "any.required": "Blog Slug is required."
    }),
    location: Joi.string().messages({
        "string.blog_slug": "Please enter a valid Blog Slug.",
        "any.required": "Blog Slug is required."
    })
});


export const updateBlogValidation = Joi.object({
    blog_title: Joi.string().required().messages({
        "string.blog_title": "Please enter a valid Blog Name.",
        "any.required": "Blog Title is required."
    }),
    description: Joi.string().required().messages({
        "string.description": "Please enter a valid description.",
        "any.required": "Description is required."
    }),
    blog_id: Joi.string().required().messages({
        "string.blog_id": "Please enter a valid blog id.",
        "any.required": "Blog Id is required."
    }) 
});

