var express = require("express");
var router = express.Router();
var userModel = require("./users");
var productModel = require("./product");
var config = require("../config/config");
var orders=require("./orders");
const multer = require("multer");
var userimage = multer({ storage: config.userimages });
var productimage = multer({ storage: config.productimage });
const passport = require("passport");
const { default: mongoose } = require("mongoose");
const LocalStrategy = require("passport-local").Strategy;
passport.use(new LocalStrategy(userModel.authenticate()));
/* GET home page. */
router.get("/", redirectToProfile, function (req, res, next) {
  res.render("registerLoginuser");
});
router.get("/register", function (req, res) {
  res.redirect("/");
});
//yaha par register function ho gya hai
router.post("/register", function (req, res) {
  var newUser = new userModel({
    username: req.body.username,
    name: req.body.name,
    isSeller: req.body.isSeller,
    contactnumber: req.body.contactnumber,
    email: req.body.email,
  });
  userModel.register(newUser, req.body.password).then(function (u) {
    console.log(u);
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

//THIS IS A PROFILE PAGE WHERE VENDOR SEE HOW MANY PRODUCT IT CAN CREATED
router.get("/profile", isLoggedIn, async function (req, res) {
  let userdata = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("products");
  let verified = true;
  let ans = userdata.toJSON();
  console.log(ans);
  var ignore = ["products", "wishlist"];
  for (let val in ans) {
    if (ignore.indexOf(val) === -1 && ans[val].length === 0) {
      verified = false;
    }
  }
  console.log(verified);
  res.render("profile", { userdata, verified });
});
//This code is a Mart page route where we are Showing All products
router.get("/mart", isLoggedIn, async function (req, res) {
  let allProducts = await productModel.find().limit(8).populate("sellerid");
  res.render("mart", { allProducts });
});
//This Code for the product page in which only vendor created product is showed
router.get("/product", isLoggedIn, async function (req, res) {
  let loginuser = await userModel.findOne({
    username: req.session.passport.user,
  });
  let allProducts = await productModel.find();
  res.render("vendorProduct", { allProducts, loginuser });
});
//LOGIN KA CODE HAI YE
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/",
  }),
  function (res, req, next) {}
);
//LOGOUT KA CODE HAI
router.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
// verify routes
router.get("/verify", isLoggedIn, async function (req, res) {
  let user = await userModel.findOne({ username: req.session.passport.user });
  res.render("verifyuser", { userdata: user });
});
router.post("/verify", isLoggedIn, async function (req, res, next) {
  // let user= await userModel.findOne({username:req.session.passport.user});
  let data = {
    username: req.body.username,
    name: req.body.name,
    isSeller: req.body.isSeller,
    email: req.body.email,
    contactnumber: req.body.contactnumber,
    gstin: req.body.gstin,
    address: req.body.address,
  };
  let updateduser = await userModel.findOneAndUpdate(
    { username: req.session.passport.user },
    data
  );
  console.log(updateduser);
  res.redirect("/profile");
});
/*------------------------------------------------------------------------------------------------------------------------------------------------------------*/
/*-----------------------------------------NOW WORKING ON SECOND DATABASE PRODUCT DATABASE-------------------------------------------------------------------*/
//SHOW THE CREATE PRODUCT PAGE HERE
router.post(
  "/create/product",
  isLoggedIn,
  productimage.array("images", 3),
  async function (req, res, next) {
    let user = await userModel.findOne({ username: req.session.passport.user });
    if (user.isSeller) {
      const productData = {
        sellerid: user._id,
        name: req.body.name,
        pic: req.files.map((fn) => fn.filename),
        desc: req.body.desc,
        price: req.body.price,
      };
      let userproductmodel = await productModel.create(productData);
      user.products.push(userproductmodel._id);
      await user.save();
      console.log(user);
      res.redirect("back");
    } else {
      res.send("you don't have a vendor Account");
    }
  }
);
//delete the product
router.get("/delete/product/:id", isLoggedIn, async function (req, res) {
  let product = await productModel
    .findOne({ _id: req.params.id })
    .populate("user");
  let user = await userModel.findOne({ username: req.session.passport.user });

  if (product.sellerid.username === user.username) {
    await productModel.findOneAndDelete({ _id: req.params.id });
    user.products.splice(user.products.indexOf(product._id), 1);
    user.save();
  }
  res.redirect("/profile");
});
/*
 wishlist mai product add ho rha hai 
 agar user ke wishlist ke ander jo id hai vo agar product ko push kar do ander 
 agar same hoti hai tu particular us index pe delete kar do
*/
router.get("/wishlist/product/:id", isLoggedIn, async function (req, res) {
  let user = await userModel.findOne({ username: req.session.passport.user });
  let wishproduct = await productModel.findOne({ _id: req.params.id });
  if (user.wishlist.indexOf(wishproduct._id) === -1) {
    user.wishlist.push(req.params.id);
  } else {
    user.wishlist.splice(user.wishlist.indexOf(wishproduct._id), 1);
  }
  await user.save();
  console.log(user);
  res.redirect("back");
});
/*
Wishlist ka product get karke sare user ke wishlist ke product show karege
*/
router.get("/wishlist", isLoggedIn, async function (req, res) {
  let user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("wishlist");
  res.render("wishlist", { user });
});
//UPLOAD PROFILE PHOTO
router.post(
  "/upload",
  isLoggedIn,
  userimage.single("image"),
  async function (req, res) {
    let user = await userModel.findOne({ username: req.session.passport.user });
    user.pic = req.file.filename;
    await user.save();
    res.redirect("/profile");
  }
);
/*this is the router for add to  card*/

router.get("/addtoCart/:id", isLoggedIn, async function (req, res) {
  let user=await userModel.findOne({username:req.session.passport.user}).populate("addtocart");
  let product=await productModel.findOne({_id:req.params.id});
  
  //let newObjectIds=user.addtocart.findIndex((item)=> item.productId ==req.params.id);

  if(user.addtocart){
      const itemIndex=user.addtocart.findIndex((item)=>item.productId== req.params.id);
      console.log(itemIndex);
      if(itemIndex>-1){
        let myproduct=user.addtocart[itemIndex];
        let myorders=await orders.findOne({_id:myproduct._id});
        myorders.quantity+=1;
        myorders.save();
        res.status(200).json({
           message:"quantity badh gyi hai",
           user:user
        });
        
      }else{
        let data={
          userId:user._id,
          productId:req.params.id,
          productName:product.name,
          quantity:1,
          bill:product.price,
          currentPrice:product.price,
          productPic:product.pic[0],
        } 
        let dummyOrders=await orders.create(data);
        console.log(dummyOrders);
        user.addtocart.push(dummyOrders._id);
        user.save();
        res.status(200).redirect("/addtocart");
        
      }  
  }else{
    let data={
      userId:user._id,
      productId:req.params.id,
      productName:product.name,
      quantity:1,
      bill:product.price,
      currentPrice:product.price,
      productPic:product.pic[0],
    } 
    let dummyOrders=await orders.create(data);
    console.log(dummyOrders);
    user.addtocart.push(dummyOrders._id);
    user.save();
    res.status(200).redirect("/addtocart");
  }
});
router.get("/addtocart",isLoggedIn, async function(req,res){
   let user=await userModel.findOne({username:req.session.passport.user}).populate("addtocart");
  console.log(user);
  let total=0;
   user.addtocart.forEach(function(elem){
      total= total+elem.bill;
   })
   console.log(total);
   res.render("addtocart",{user:user,total:total});
})

router.get("/quantityAdd/:id",isLoggedIn, async function(req,res){
    let user=await userModel.findOne({username:req.session.passport.user}).populate("addtocart");
    console.log(user);
    const itemIndex=user.addtocart.findIndex((item)=>item._id==req.params.id);
    console.log(itemIndex);
    let myproduct=user.addtocart[itemIndex];
    let myorders=await orders.findOne({_id:myproduct._id});
    myorders.quantity+=1;
    myorders.bill=myorders.currentPrice+myorders.bill;
    myorders.save();
    res.status(200).redirect("/addtocart");
})
router.get("/quantitySub/:id",isLoggedIn,async function(req,res){
     let user=await userModel.findOne({username:req.session.passport.user}).populate("addtocart");
     console.log(user);
      const itemIndex=user.addtocart.findIndex((item)=> item._id==req.params.id);
      console.log(itemIndex);
      let myproduct=user.addtocart[itemIndex];
      let myorders=await orders.findOne({_id:myproduct._id});
      myorders.quantity-=1;
      myorders.bill= Math.abs(myorders.bill-myorders.currentPrice);
      myorders.save();
      res.status(200).redirect("/addtocart");
   
})
// LOGGED FUNCTION
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/");
  }
}
function redirectToProfile(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect("/profile");
  } else {
    return next();
  }
}

module.exports = router;
/*---------------------------------------------------------------------------------------------------------------*/
/*
 THIS IS THE REDIRECT FUNCTION 
 THIS FUNCTION IS THE MIDDLEWARE FOR THE / PAGE FUNCTION IF THE USER IS LOGGED THEN 
 IT WILL NOT COMEBACK EVERY TIME ON THE LOGIN PAGE UNTIL UNLESS IT WILL LOGOUT  
*/
/*router.get("/addtocart", isLoggedIn, async function (req, res) {
  let user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("addtocart");
  let sum = 0;
  user.addtocart.forEach(function (elem) {
    console.log(elem);
    console.log(elem.price);
    sum += elem.price;
  });
  console.log(sum);
  res.render("addtocart", { user: user, sum });
});*/
/*-----------------------------------------------------------------------------------------------------------*/
/*let user = await userModel.findOne({ username: req.session.passport.user });
  let product=await productModel.findOne({id:req.params.id});
  user.addtocart.push(req.params.id);
  user.save();
  console.log(user);
  res.redirect("/addtocart");*/
 /* let user=await userModel.findOne({username:req.session.passport.user});
  let order=await orders.findOne({userId:user._id});
  try {
    if(req.params.id===-1){
      let data={
        userId:user._id,
        productId:req.params.id,
        count:1,
     };
     let myorders= await orders.create(data)
     user.addtocart.push(myorders._id);
     user.save();
     console.log(myorders); 
     res.redirect("/addtocart");
    }else{
      console.log("KuchProblem hai bhai");
      res.redirect("/addtocart");
    }   
  } catch (error) {
    console.log(error);
  }  */
/*-------------------------------------------------------------------------------------------------------------*/
/* if(user.addtocart.indexOf(req.params.id)===-1){ 
      let dummyOrders=await orders.create(data);
      user.addtocart.push(dummyOrders._id);
      user.save();
      console.log(user);
      res.status(200).send(user);
  }else{
     res.redirect("/mart");
  } */
/*--------------------------------------------------------------------------------------------------------------*/
 /*console.log(newObjectIds);
      user.addtocart[newObjectIds].quantity+=user.addtocart[newObjectIds].quantity;
      user.save();
       res.status(200).json({
      msessage:"bhai saab if condition chal rhi hai ",
      data:user,
      filter:newObjectIds,
    })*/
    /*---------------------------------------------------------------------------------------------------------*/
    /*let myproduct=user.addtocart[itemIndex];
        console.log(myproduct._id);
        let myorders= await orders.findOne({_id:myproduct._id});
        myorders.quantity+=1;
        //myorders.bill=myorders.quantity*myorders.bill;
        myorders.save();
        //myproduct.quantity++;
        user.addtocart[itemIndex]=myproduct;
         user.save();
        res.status(200).json({
          message:"khali hai ",
          index:itemIndex,
          user:user,
          orders:myorders
     })*/
     // let newObjectIds=user.addtocart.filter((item)=>item.productId!==req.params.id);
     //user.addtocart.productId=== mongoose.Types.ObjectId(req.params.id)
    /*let found=user.addtocart.map((elem)=>elem.id);
  console.log(found);*/
  /* if(elem.id===req.params.id){
        let myorders={
          id:elem.id,
          itemPrice:elem.price,
          itemName:elem.name,
          count:{
            default:0
          },
        }
        orders.push(myorders);
        console.log(orders);
        console.log(true);
       }*/
       /*res.status(201).json({
          message:"add ho gya bhai product khali addtocart mai",
          data:user
        });*/