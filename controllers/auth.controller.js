import { getUserByEmail,createUser, hashPassword, comparePassword ,generateToken} from "../models/auth.model.js";

export const getRegisterPage=(req,res)=>{
   if(req.user) return res.redirect("/");
   return res.render("auth/register",{errors:req.flash("errors")});

};

export const getLoginPage=(req,res)=>{
   if(req.user) return res.redirect("/");
   return res.render("auth/login",{errors:req.flash("errors")})

};

export const postLogin=async(req,res)=>{

   if(req.user) return res.redirect("/");

   const { email, password}=req.body;
   const user= await getUserByEmail(email);
   // console.log("userExists",user);

   if(!user) {
      req.flash("errors","Invalid Email or Password");
      return res.redirect("/login");
   }

   const isPasswordValid= await comparePassword(password,user.password);

   if (!isPasswordValid){
      req.flash("errors","Invalid Email or Password");
      return res.redirect("/login");
   }
   
   // const token=generateToken({
   //    id:user.id,
   //    name:user.name,
   //    email:user.email,
   // });

   const token = generateToken(user);

   
   res.cookie("access_token",token);
   res.redirect("/");
};


export const postRegister = async (req, res) => {
   try {
      if(req.user) return res.redirect("/");
   //   console.log(req.body);
     const { name, email, password } = req.body;
 
     const userExists = await getUserByEmail(email);
   //   console.log("User exists:", userExists);
 
     if (userExists) {
      //  console.log("User already exists.");
       req.flash("errors","User already exists");
       return res.redirect("/register");
     }

     const hashedPassword= await hashPassword(password)
 
     const user = await createUser({ name, email, password:hashedPassword });
   //   console.log("User inserted successfully:", user);
 
     res.redirect("/login");
   } catch (err) {
   //   console.error("Registration Error:", err.message);
     res.status(500).send("Internal Server Error");
   }
 };

 export const getMe=(req,res)=>{
   if(!req.user) return res.send("Not Logged in");
   return res.send(`<h1> Hey ${req.user.name} - ${req.user.email} </h1>`)

 }

 export const logoutUser=(req,res)=>{
   res.clearCookie("access_token");
   res.redirect('/login')

 };