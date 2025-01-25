import { readFile ,writeFile} from "fs/promises";
import {createServer} from "http";
import path from "path";
import crypto from "crypto";

const DATA_FILE=path.join("url2","data","links.json");


const  Server=async(res,filePath,content)=>{
    try
    {
        const data= await readFile(filePath,"utf-8");
        res.writeHead(202,{"Content-Type":`${content}`});
        res.end(data);

    }
    catch(error)
    {
        res.writeHead(404,{"Content-Type":"text/plain"});
        res.end("404 page not Found");
    }

};

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



const server=createServer( async (req,res)=>{
    const url=req.url;
    const method=req.method;
    if(method==='GET')
    {
        if(url==='/' )
        {
           return Server(res,path.join("url2","public","index.html"),"text/html");
        }
        else if(url==='/style.css')
        {
            return Server(res,path.join("url2","public","style.css"),"text/css")
        }
        else if(url==="/links")
        {
            const links=await loadLinks();
            res.writeHead(200,{"Content-Type":"application/json"});
            res.end(JSON.stringify(links));

        }
        else
        {
            const links=await loadLinks();
            const shortCode=url.slice(1);
            console.log("link redirect", shortCode);
            if(links[shortCode])
            {
                res.writeHead(302,{location: links[shortCode]});
                return res.end();
            }

            res.writeHead(404,{"Content-Type":"text/plain"});
            return res.end("shortened url not found");
        }
    }
    if(method==="POST" && url==="/shorten")
    {
        const links=await loadLinks();   // to fetch json data

        let data="";
        req.on('data',(chunk)=>data+=chunk);

        req.on('end',async ()=>{
            console.log(data);
            const {url,shortCode}=JSON.parse(data);
            if(!url){
                res.writeHead(400,{"Content-Type":"text/plain"});
                return res.end("Url is required");
            }

            const finalShortCode=shortCode ||crypto.randomBytes(4).toString("hex"); //to check duplicate data

            if(links[finalShortCode])
            {
                res.writeHead(400,{"Content-Type":"text/plain"});
                return res.end("ShortCode already exist. Please Try another.");

            }

            links[finalShortCode]=url;
            await saveLinks(links);

            res.writeHead(200,{"Content-Type":"application/json"});
            res.end(JSON.stringify({success:true,shortCode:finalShortCode}));
        });
    }



});

server.listen(3000,()=>console.log('listening server with port no. 3000'));