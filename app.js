import express from "express";
import {shortenerRoots} from "./routes/shortner.routes.js";



const app=express();

const PORT=process.env.PORT ||3000;



app.use(express.static("public"));



app.use(express.urlencoded({extended:true}));

app.use(shortenerRoots);

app.set("view engine","ejs");

app.listen(3000,()=>console.log('listening server with port no.',PORT));