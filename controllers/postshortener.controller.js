import crypto from "crypto";
import { loadLinks,saveLinks,getLinkByShortCode } from "../models/shortener.model.js";

export const getShortenerPage=async(req,res)=>{
    try {

        if(!req.user) return res.redirect("/login");

        const links=await loadLinks(req.user.id); 
        // console.log("getShortenerPage → req.user.id:", req.user?.id);
        // console.log("Links loaded:", links);


        res.render("index",{links,hosts:req.hostname})
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal server error");
        
    }
};

export const postURLShortener=async(req,res)=>{
    try {
        
        if(!req.user) return res.redirect("/login");

        // console.log("postURLShortener req.body:", req.body);

        const {url,shortCode}=req.body;
        const finalShortCode=shortCode||crypto.randomBytes(4).toString("hex");
        const links=await getLinkByShortCode(finalShortCode);
        if(links){
            return res.status(400).send(`<h1>Shortcode already exist. Try another..<a href='/'> Go Back </a></h1> `);
        }
        await saveLinks({url,shortCode:finalShortCode,userId:req.user.id}); //DB

        return res.redirect("/");
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal server error");
        
    }
};

export const redirectToShortLink=async(req,res)=>
{
    try {
        const {shortCode}=req.params;
        const links =await getLinkByShortCode(shortCode);
        if(!links) return res.status(404).send("404 error occurred");
        return res.redirect(links.url);
    } catch (error) {

        console.error(error);
        return res.status(500).send("Internal server error");
    }
};
