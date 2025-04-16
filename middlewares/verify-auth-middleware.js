import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import { refreshTokens, verifyJWTToken } from "../models/auth.model.js";
// export const verifyAuthentication=(req,res,next)=>{
//     const token=req.cookies.access_token;
//     if(!token){
//         req.user=null
//         return next();
//     }

//     try {
//         const decodedToken=verifyJWTToken(token);
//         req.user=decodedToken;
//         // console.log("req.user: ",req.user);
//     } catch (error) {
//         req.user=null;
//     }

//     return next();
// };

export const verifyAuthentication=async(req,res,next)=>{
    const access_token=req.cookies.access_token;
    const refreshToken=req.cookies.refresh_token;

    req.user=null
    if(!access_token && !refreshToken){
        console.log("No tokens found. Setting req.user to null.");
        return next();
    }

    if(access_token)
    {
        const decodedToken=verifyJWTToken(access_token);
        req.user=decodedToken;
        console.log("req.user: ",req.user);
        return next();

    }
    if(refreshToken){
        try
        {
            // const {newaccessToken,newrefreshToken,user} =await refreshTokens(refreshToken);
            const tokens = await refreshTokens(refreshToken);

            if (!tokens) {
            console.error("refreshTokens returned undefined or null");
            return res.status(401).json({ error: "Unauthorized" });
            }

            const { newaccessToken, newrefreshToken, user } = tokens;


            req.user=user;
            console.log("new:",req.user);
            
            const baseConfig={httpOnly:true,secure:true}; //this ensures only run on https and cannot get cookie 
            res.cookie("access_token",newaccessToken,{
               ...baseConfig,
               maxAge:ACCESS_TOKEN_EXPIRY
            });
            
            res.cookie("refresh_token",newrefreshToken,{
               ...baseConfig,
               maxAge:REFRESH_TOKEN_EXPIRY
            });

            return next();

        } catch (error) {
            console.log(error.message);
        }
    }

    return next();

}