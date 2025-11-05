import mongoose, { Document,  Schema } from "mongoose";

export interface IEventUser extends Document {
   email: string,
   password : string,
   contact : number,
   panNo :string,
   userType : any,
   name :string
   compayId? : mongoose.Types.ObjectId
}

const EventUserSchema: Schema = new Schema<IEventUser>(
    {
        email : {type : String,required :true},
        password :{type : String},
        contact : {type:Number},
        panNo :{type:String},
        name : {type :String},
        userType:[
            {type : mongoose.Types.ObjectId, ref :'UserType'}            
        ],
        compayId : {type : mongoose.Types.ObjectId , ref : 'Company'}
    }
);

export default mongoose.model<IEventUser>("EventUser", EventUserSchema);
