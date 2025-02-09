import crypto from "crypto";
// import { readFile } from "fs/promises";
import { loadLinks,saveLinks,getLinkByShortCode } from "../models/shortener.model.js";
// import path from "path";

export const getShortenerPage=async(req,res)=>{
    try {
        // const file=await readFile(path.join("views","index.html"));
        const links=await loadLinks();

        return res.render("index",{links,host:req.host});
        
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
};

export const postURLShortener=async(req,res)=>{
    try {
        const {url,shortCode}=req.body;
        const finalShortCode=shortCode ||crypto.randomBytes(4).toString("hex"); //to check duplicate data

        const links=await loadLinks();

            if(links[finalShortCode])
            {
                return res.status(400).send("Short code already exists. Please choose another");

            }

        // links[finalShortCode]=url;
        // await saveLinks(links);
        await saveLinks({url,shortCode});
        return res.redirect("/");


    } catch (error) {
        return res.status(500).send("Internal Server Error");
        
    }
};

export const redirectToShortLink=async(req,res)=>{
    try {
        const {shortCode}=req.params;

    //     const links=await loadLinks();
    //    if(!links[shortCode]) return res.status(404).send("404 error occurred.");
          
          const link=await getLinkByShortCode(shortCode);
          console.log(link);
          if(!link) return res.status(404).send("404 error occurred.");

        return res.redirect(link.url);
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal server error");
        
    }
}