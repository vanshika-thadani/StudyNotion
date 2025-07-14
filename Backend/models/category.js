const mongoose=require('mongoose');

const categorySchema=new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
        },
        description:{
            type:String,
        },
        course:[{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Course",
        }]
        //ek category multiple courses ke liye ho skta h so make it array
    }
);
module.exports=mongoose.model("Category",categorySchema);
