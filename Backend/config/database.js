const mongoose=require('mongoose');
require('dotenv').config();

exports.connect=()=>{
    mongoose.connect(process.env.MONGODB_URL,
        {
            useNewUrlParser:true,
            useUnifiedTopology:true,
        }
    )
    .then(()=> console.log("DB connection successful"))
    .catch((err)=> {
        console.log("DB coonnection failed");
        console.error(err);
        process.exit(1);
    })
}