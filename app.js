import { readFile ,writeFile} from "fs/promises";
import path from "path";
import crypto from "crypto";
import express from "express";


const app=express();

const PORT=process.env.PORT ||3000;

const DATA_FILE=path.join("data","links.json");

app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));




const loadLinks=async()=>{
    try{

        const data=await readFile(DATA_FILE,'utf-8');
        return JSON.parse(data);

    }
    catch(err)
    {
      if(err.code==="ENOENT")
      {
        await writeFile(DATA_FILE,JSON.stringify({}));
        return{};
      }
      throw err;
    }

};

const saveLinks=async(links)=>{
    await writeFile(DATA_FILE,JSON.stringify(links));
}

app.get("/",async(req,res)=>{
    try {
        const file=await readFile(path.join("views","index.html"));
        const links=await loadLinks();

        const content=file.toString().replaceAll("{{shortend_urls}}",Object.entries(links).map(
            ([shortCode,url])=>`<li><a href="/${shortCode}" target="_blank"> ${req.host}/${shortCode}</a> -> ${url}</li>`
        ).join(""));

        return res.send(content);;
        
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
});

app.post("/",async(req,res)=>{
    try {
        const {url,shortCode}=req.body;
        const finalShortCode=shortCode ||crypto.randomBytes(4).toString("hex"); //to check duplicate data

        const links=await loadLinks();

            if(links[finalShortCode])
            {
                return res.status(400).send("Short code already exists. Please choose another");

            }

        links[finalShortCode]=url;
        await saveLinks(links);
        return res.redirect("/");


    } catch (error) {
        return res.status(500).send("Internal Server Error");
        
    }
});

app.get("/:shortCode",async(req,res)=>{
    try {
        const {shortCode}=req.params;
        const links=await loadLinks();

        if(!links[shortCode]) return res.status(404).send("404 error occurred.");

        return res.redirect(links[shortCode]);
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal server error");
        
    }
});


app.listen(3000,()=>console.log('listening server with port no.',PORT));