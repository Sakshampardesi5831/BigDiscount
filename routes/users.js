 require("dotenv").config({path:"./.env"});
 const mongoose=require("mongoose");
 var plm=require("passport-local-mongoose");
//  mongoose.connect("mongodb://localhost/myamazon2")
// .then(function(){
//     console.log("connected to db");XXe5ROoezVFTtwjv
// })
mongoose.connect(`mongodb+srv://sakshampardesi5831:${process.env.password}@cluster0.3fabgri.mongodb.net/myamazon?retryWrites=true&w=majority`).then(function(){
  console.log('connected to db');
})
var userSchema= mongoose.Schema({
  username:String,
  name:String,
  gstin:String,
  isSeller:{
    type:Boolean,
    default:false
  },
  pic:String,
  address:String,
  contactnumber:String,
  email:String,
  password:String,
  products:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"product"
  }],
  wishlist:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"product"
  }],
  addtocart:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"order"
  }]
})
userSchema.plugin(plm);
module.exports=mongoose.model("user",userSchema);