import mongoose from "mongoose";
import { convertToSlug } from "../../helper/helper";
import BLogSchema from "../schema/eventblog.schema";
import { env } from "process";

interface storeEventBlog{
    blog_title:string;
    blog_slug:string;
    description:string;
    blog_image:string;
}

interface UpdateEventBlog{
    blog_title:string;
    blog_slug:string;
    description:string;
    blog_image:string;
    blog_id:string;
}

interface eventBlogData {
    blog_title:string;
    blog_slug:string;
    description:string;
    blog_image:string;
}

export const storeBlog = async (blogData: storeEventBlog, callback: (error: any, result: any) => void) => {
    try {
        const newBlog = new BLogSchema({
            blog_title: blogData.blog_title,
            description: blogData.description,
            blog_image: blogData.blog_image,
            status: 1,
        });

        const savedBlog = await newBlog.save();

        return callback(null, { savedBlog });
    } catch (error) {
        console.error("Error during blog creation:", error);
        return callback(error, null); 
    }
};

export const updateEventBlog = async (
    blogData: UpdateEventBlog, 
    callback: (error: any, result?: any) => void
) => {
    try {
        const existingBlog = await BLogSchema.findById(blogData.blog_id);

        if (!existingBlog) {
            return callback({ message: "Blog not found" }, null);
        }

        // Update only the fields that are provided in blogData
        if (blogData.blog_title) existingBlog.blog_title = blogData.blog_title;
        if (blogData.description) existingBlog.description = blogData.description;
        if (blogData.blog_image) existingBlog.blog_image = blogData.blog_image;

        const savedBlog = await existingBlog.save();
        return callback(null, { message: "Blog updated successfully", savedBlog });

    } catch (error) {
        console.error("Error during blog update:", error);
        return callback(error, null);
    }
};


export const eventBlogdList = async (eventBlogData: eventBlogData ,page: number, pageSize: number, searchQuery: string, callback: (error: any, result: any) => void) => {
    try {

        const currentPage = page || 1;
        const size = pageSize || 10;

        const skip = (currentPage - 1) * size;

        const searchFilter: any = {};

        if (searchQuery) {
            searchFilter.$or = [
                { blog_title: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { blog_slug: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        let users = await BLogSchema.find(searchFilter).skip(skip).limit(size).lean();
        const totalUsers = await BLogSchema.countDocuments(searchFilter);
        const baseUrl = env.BASE_URL; 
        users = users.map(blog => ({
            ...blog, 
            blog_image : baseUrl +'/'+ blog.blog_image,
            description: blog.description
        }));
        const result = {
            currentPage: currentPage,
            totalPages: Math.ceil(totalUsers / size),
            totalUsers: totalUsers,
            users: users,
        };
        return callback(null, result);
        
    } catch (error) {
        return callback(error, null);
    }
}


export const eventBlogdLocationList = async (
    eventBlogData: any, 
    page: number, 
    pageSize: number, 
    searchQuery: string, 
    currentLocation: string | null, 
    callback: (error: any, result?: any) => void
) => {
    try {
        const currentPage = page || 1;
        const size = pageSize || 10;
        const skip = (currentPage - 1) * size;

        const searchFilter: any = {};

        if (searchQuery) {
            searchFilter.$or = [
                { blog_title: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { blog_slug: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        let blogs = await BLogSchema.find(searchFilter).skip(skip).limit(size).lean();
        const totalBlogs = await BLogSchema.countDocuments(searchFilter);
        const baseUrl = env.BASE_URL; 
        blogs = blogs.map(blog => ({
            ...blog, 
            blog_image : baseUrl +'/'+ blog.blog_image,
            description: blog.description?.replace(/\{LOCATION\}/g, currentLocation ? currentLocation : '') || ""
        }));
        

        const result = {
            currentPage,
            totalPages: Math.ceil(totalBlogs / size),
            totalBlogs,
            blogs,
        };

        return callback(null, result);

    } catch (error) {
        console.error("Error fetching event blog list:", error);
        return callback(error, null);
    }
};


