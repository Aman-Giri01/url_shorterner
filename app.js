import path from "path";
import express from "express";
import { env } from "./config/env.js";

import requestIp from "request-ip";
// import {shortenerRoutes} from "./routes/shortener.routes.js";
import { shortenerRoutes } from "./routes/shortner.routes.js";
import { authRoute } from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import { verifyAuthentication } from "./middlewares/verify-auth-middleware.js";
import session from "express-session";
import flash from "connect-flash";

const app=express();
const staticPath=path.join(import.meta.dirname,"public")

app.use(express.static(staticPath));
app.use(express.urlencoded({extended:true}));

app.use(cookieParser());

app.use(session({secret:"my-secret",resave:true,saveUninitialized:false}));

app.use(flash());

app.use(requestIp.mw());

app.use(verifyAuthentication); //verify jwt
app.use((req,res,next)=>{
  res.locals.user=req.user;
  return next();
});

app.use(authRoute);
app.use(shortenerRoutes);
// Ejs
const viewPath=path.join(import.meta.dirname,"views");
// console.log(viewPath);
app.set("view engine","ejs");
app.set("views",viewPath);

const PORT=env.PORT;
app.listen(PORT,()=>console.log(`server running at port no. ${PORT}`));


