import mongoose, { Document, Schema } from 'mongoose';
import slugify from 'slugify'; 

export interface IBlog extends Document {
    blog_title: string;
    blog_slug: string;
    blog_image: string;
    description: string;  
    status: number;  
    createdAt: Date;
    updatedAt: Date;
    generateSlug: () => string;  
    updateStatus: (status: number) => void;  
}

const BlogSchema: Schema = new Schema<IBlog>(
    {
        blog_title: { type: String, required: true },
        blog_slug: { type: String, unique: true },
        blog_image: { type: String, required: false },
        description: { type: String, required: true },
        status: { type: Number, default: 1 },  
    },
    {
        collection: 'blogs',
        timestamps: true,  
    }
);

BlogSchema.methods.generateSlug = function (): string {
    return slugify(this.blog_title, { lower: true, replacement: '-', strict: true });
};

BlogSchema.methods.updateStatus = function (status: number) {
    this.status = status;  
    return this.save();  
};

BlogSchema.pre<IBlog>('save', function (next) {
    if (this.isNew || this.isModified('blog_title')) {
        this.blog_slug = this.generateSlug();
    }
    next();
});


export default mongoose.model<IBlog>('Blog', BlogSchema);
