import { ObjectId } from "mongodb";
import { getUserByEmail,createUser, hashPassword, comparePassword , authenticateUser, clearUserSession, findUserById, sendNewVerifyEmailLink, findVerificationEmailToken, verifyUserEmailAndUpdate, clearVerifyEmailTokens, updateUserByName, updateUserPassword, findUserByEmail, createResetPasswordLink, getResetPasswordToken, clearResetPasswordToken, linkUserWithOauth, createUserWithOauth, getUserWithOauthId} from "../models/auth.model.js";
import { loadLinks } from "../models/shortener.model.js";
import { forgotPasswordSchema, loginUserSchema,registerUserSchema, verifyEmailSchema, verifyPasswordSchema, verifyResetPasswordSchema, verifyUserSchema } from "../validators/auth-validator.js";
import { getHtmlFromMjmlTemplate } from "../lib/get-html-from-mjmltemplate.js";
import { sendEmail } from "../lib/nodeMailer.js";
import { decodeIdToken, generateCodeVerifier, generateState } from "arctic";
import { google } from "../lib/oauth/google.js";
import { OAUTH_EXCHANGE_EXPIRY } from "../config/constants.js";
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

   if(!user.password){
    req.flash(
       "errors",
       "You have created account using social login. Please login with your social account."
    );
    return res.redirect('/login');
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

// logout user

export const logoutUser = async (req, res) => {
  const sessionId = req.user?.sessionId;
  await clearUserSession(sessionId);
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.redirect("/login");
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
  // console.log("verificationEmailToken :",token);
  if(!token) return res.render('auth/wrong-verification-code');

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
  // console.log("data",data);
  return res.redirect("/profile");
}



// getResetPasswordPage

export const getResetPasswordPage=async(req,res)=>{
  return  res.render('auth/forgot-password',{
     formSubmitted:req.flash("formSubmitted")[0],
     errors:req.flash("errors"),
  });
}

// postForgotPassword

export const postForgotPassword=async(req,res)=>{
  const {data,error}= forgotPasswordSchema.safeParse(req.body);
  if(error){
     const errorMessages=error.errors.map((err)=>err.message);
     req.flash("errors",errorMessages);
     return res.redirect("/reset-password");
  }

  const user= await findUserByEmail(data.email);

  if(user){
     const resetPasswordLink= await createResetPasswordLink({userId:user._id});

     const html= await getHtmlFromMjmlTemplate('reset-password-email',{
        name:user.name,
        link:resetPasswordLink,
  
     });
     // console.log("html", html)
     sendEmail({
        to:user.email,
        subject:"Reset Your Password",
        html,
     });
  }
  req.flash("formSubmitted",true);
  return res.redirect("/reset-password");
  
}

// getResetPasswordTokenPage

export const getResetPasswordTokenPage = async (req, res) => {
  const { token } = req.params;
  // console.log(token);

  const passwordResetData = await getResetPasswordToken(token); 

  if (!passwordResetData) {
    return res.render('auth/wrong-reset-password-token');
  }

  return res.render('auth/reset-password', {
    formSubmitted: req.flash('formSubmitted')[0],
    errors: req.flash('errors'),
    token,
  });
};

// postResetPasswordToken

export const postResetPasswordToken=async(req,res)=>{
  const { token } = req.params;
  const passwordResetData = await getResetPasswordToken(token); 

  if (!passwordResetData) {
    req.flash("errors","Password Token is not matching.");
    return res.render('auth/wrong-reset-password-token');
  }

  const {data,error}=verifyResetPasswordSchema.safeParse(req.body);
  if(error){
     const errorMessages=error.errors.map((err)=>err.message);
     req.flash("errors",errorMessages[0]);
     return res.redirect(`/reset-password/${token}`);
  }

  const {newPassword}=data;

  const user=await findUserById(passwordResetData.user_id);

  await clearResetPasswordToken(user._id);

  await updateUserPassword({userId:user._id,newPassword});

  return res.redirect('/login');


}

// getGoogleLoginPage

export const getGoogleLoginPage = async (req, res) => {
  if (req.user) return res.redirect('/');

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, [
    'openid',
    'profile',
    'email',
  ]);

  const cookieConfig = {
    httpOnly: true,
    secure: true,
    maxAge: OAUTH_EXCHANGE_EXPIRY,
    sameSite: 'lax',
  };

  res.cookie('google_oauth_state', state, cookieConfig);
  res.cookie('google_code_verifier', codeVerifier, cookieConfig);

  res.redirect(url.toString());
};

// getGoogleLoginCallback

export const getGoogleLoginCallback = async (req, res) => {
  const { code, state } = req.query;

  const {
    google_oauth_state: storedState,
    google_code_verifier: codeVerifier,
  } = req.cookies;

  if (!code || !state || !codeVerifier || state !== storedState) {
    req.flash(
      'errors',
      "Couldn't login with Google due to an invalid login attempt. Please try again!"
    );
    return res.redirect('/login');
  }

  let tokens;
  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
  } catch {
    req.flash(
      'errors',
      "Couldn't login with Google due to an invalid login attempt. Please try again!"
    );
    return res.redirect('/login');
  }

  const claims = decodeIdToken(tokens.idToken());
  const { sub: googleUserID, name, email } = claims;

  // 1. Check if user exists and is linked
  let user = await getUserWithOauthId({
    provider: 'google',
    email,
  });

  // 2. If user exists but isn't linked yet
  if (user && !user.providerAccountId) {
    await linkUserWithOauth({
      userId: user._id, 
      provider: 'google',
      providerAccountId: googleUserID,
    });
  }

  // 3. If user doesn't exist at all
  if (!user) {
    user = await createUserWithOauth({
      name,
      email,
      provider: 'google',
      providerAccountId: googleUserID,
    });
  }

  // 4. Log the user in
  await authenticateUser({ req, res, user, name, email }); // Assuming it works with MongoDB user object

  res.redirect('/');
};





