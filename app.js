import express from "express";
import { env } from "./config/env.js";
import { connectToDB } from "./config/db-client.js";
import {shortenerRoots} from "./routes/shortner.routes.js";



const app=express();
app.use(express.static("public"));



app.use(express.urlencoded({extended:true}));

app.use(shortenerRoots);

app.set("view engine","ejs");

await connectToDB();
const PORT=env.PORT;
app.listen(PORT,()=>console.log('listening server with port no.',PORT));