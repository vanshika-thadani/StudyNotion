const mongoose=require('mongoose');

const tagsSchema=new mongoose.Schema(
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
        //ek tag multiple courses ke liye ho skta h so make it array
    }
);
module.exports=mongoose.model("Tag",tagsSchema);
