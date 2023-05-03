var mongoose=require("mongoose");

let orderSchema=mongoose.Schema({
   userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
   },
   productId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"product"
   },
   productName:{
    type:String
   },
   quantity:{
    type:Number,
    default:0
   },
   currentPrice:{
     type:Number,
     default:0
   },
   bill:{
    type:Number,
    default:0
   },
   productPic:{
     type:String,  
   }
})

module.exports=mongoose.model("order",orderSchema);


 /*userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"product"
    },
    productName:{
        type:String,
    },
    price:{
        type:Number
    },
    Quantity:{
        type:Number,
        default:0
    },
    Total:{
        type:Number,
        default:0
    }*/