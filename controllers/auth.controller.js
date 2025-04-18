import { getUserByEmail,createUser, hashPassword, comparePassword , authenticateUser, clearUserSession, findUserById, sendNewVerifyEmailLink, findVerificationEmailToken, verifyUserEmailAndUpdate, clearVerifyEmailTokens, updateUserByName, updateUserPassword} from "../models/auth.model.js";
import { loadLinks } from "../models/shortener.model.js";
import { loginUserSchema,registerUserSchema, verifyEmailSchema, verifyPasswordSchema, verifyUserSchema } from "../validators/auth-validator.js";
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

  //  const { email, password}=req.body;
   const{data,error}= loginUserSchema.safeParse(req.body);  //Zod validation
     if(error){
      const errors=error.errors[0].message;
      req.flash("errors",errors);
      return res.redirect("/login");
     }

     const {email, password } = data;

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

  //  const token = generateToken(user);

   
  //  res.cookie("access_token",token);
  await authenticateUser({req,res,user});

   res.redirect("/");
};


export const postRegister = async (req, res) => {
   try {
      if(req.user) return res.redirect("/");
   //   console.log(req.body);
    //  const { name, email, password } = req.body;
    const{data,error}= registerUserSchema.safeParse(req.body);  //Zod validation
    if(error){
     const errors=error.errors[0].message;
     req.flash("errors",errors);
     return res.redirect("/register");
    }

    const { name, email, password } = data; 
 
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
 
     await authenticateUser({req,res,user,name,email});
    
     await sendNewVerifyEmailLink({email, userId:user.id }); 

     res.redirect("/");
   } catch (err) {
   //   console.error("Registration Error:", err.message);
     res.status(500).send("Internal Server Error");
   }
 };

 export const getMe=(req,res)=>{
   if(!req.user) return res.send("Not Logged in");
   return res.send(`<h1> Hey ${req.user.name} - ${req.user.email} </h1>`)

 }

//  export const logoutUser=(req,res)=>{
//    res.clearCookie("access_token");
//    res.redirect('/login')

//  };

export const logoutUser=async(req,res)=>{

  await clearUserSession(req.user.sessionId)
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.redirect('/login')

};

// get profile page

export const getProfilePage=async(req,res)=>{
  if (!req.user) return res.send("Not logged in");
  const user= await findUserById(req.user.id);
  if(!user) return res.redirect('/login');

  const userShortLinks= await loadLinks(req.user.id);
  // console.log("user short links",userShortLinks);

  return res.render('auth/profile',{
     user:{
        id:user.id,
        name:user.name,
        email:user.email,
        is_email_valid:user.is_email_valid,
        createdAt:user.createdAt,
        links:userShortLinks,
     },

  })
};

// get verify email page

export const getVerifyEmailPage= async(req,res)=>{
  // if(!req.user || req.user.isEmailValid) return res.redirect("/");
  if(!req.user) return res.redirect("/");
  const user= await findUserById(req.user.id);

  if(!user || user.is_email_valid) return res.redirect("/");

  return res.render("auth/verify-email",{
     email:req.user.email,
  });
};

// resend verification link

export const resendVerificationLink= async(req,res)=>{
  if(!req.user) return res.redirect("/");
  const user= await findUserById(req.user.id);

  if(!user || user.is_email_valid) return res.redirect("/");

  await sendNewVerifyEmailLink({ email: req.user.email, userId: req.user.id });
  
  res.redirect('/verify-email')

};

// verify Email token

export const verifyEmailToken= async(req,res)=>{
  const {data,error}=verifyEmailSchema.safeParse(req.query);

  if(error){
     return res.send("Verification link invalid or expires!");
  }
  const token= await findVerificationEmailToken(data);
  console.log("verificationEmailToken :",token);
  if(!token) res.send("Verification link invalid or expired!");

  await verifyUserEmailAndUpdate(token.email);

  await clearVerifyEmailTokens(token.email).catch(console.error);

  res.redirect('/profile');


};

// getEdit Profile Page

export const getEditProfilePage= async(req,res)=>{
  if(!req.user)return res.redirect("/");

  const user= await findUserById(req.user.id);

  if(!user) return res.status(404).send("User Not Found");
  console.log("USER NAME: ",user.name);

  return res.render("auth/edit-profile",{
     name: user.name,
     errors:req.flash("errors"),
  });
}

// postEditProfile

export const postEditProfile=async(req,res)=>{
  if(!req.user)return res.redirect("/");

  const {data,error}=verifyUserSchema.safeParse(req.body);
  if(error){
     const errors=error.errors[0].message;
     req.flash("errors",errors);
     return res.redirect("/edit-profile");
    }

    await updateUserByName(req.user.id,data.name);

    return res.redirect('/profile');

}

// getChangePasswordPage

export const getChangePasswordPage=async(req,res)=>{
  if(!req.user)return res.redirect("/");

  res.render('auth/change-password',{
     errors:req.flash("errors")
  });
};

// postChangePassword
export const postChangePassword=async(req,res)=>{
  const {data,error}=verifyPasswordSchema.safeParse(req.body);
  if(error){
     const errorMessages=error.errors.map((err)=>err.message);
     req.flash("errors",errorMessages);
     return res.redirect("/change-password");
  }

  const {currentPassword,newPassword}=data;

  const user= await findUserById(req.user.id);
  if(!user) return res.status(404).send("User Not Found");

  const isPasswordValid=await comparePassword(currentPassword,user.password);
  if(!isPasswordValid){
     req.flash("errors","Current Password that you entered is invalid");
     return res.redirect('/change-password');
  }

  await updateUserPassword({userId:user._id,newPassword});
  console.log("data",data);
  return res.redirect("/profile");
}




