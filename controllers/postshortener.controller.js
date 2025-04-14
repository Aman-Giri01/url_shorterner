import crypto from "crypto";
import z from "zod";
import { shortenerSchema } from "../validators/shortener-validator.js";
import { loadLinks,saveLinks,getLinkByShortCode,deleteShortCodeById,updateShortCode,findShortLinkById } from "../models/shortener.model.js";

export const getShortenerPage=async(req,res)=>{
    try {

        if(!req.user) return res.redirect("/login");

        const links=await loadLinks(req.user.id); 
        // console.log("getShortenerPage → req.user.id:", req.user?.id);
        // console.log("Links loaded:", links);


        res.render("index",{links,hosts:req.hostname,errors:req.flash("errors")})
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal server error");
        
    }
};

export const postURLShortener=async(req,res)=>{
    try {
        
        if(!req.user) return res.redirect("/login");

        // console.log("postURLShortener req.body:", req.body);

        // const {url,shortCode}=req.body;
        const { data, error } = shortenerSchema.safeParse(req.body);
        if (error) {
        const errorMessage = error.errors[0].message;
        req.flash("errors", errorMessage);
        return res.redirect("/");
        }

        const { url, shortCode } = data;



        const finalShortCode=shortCode||crypto.randomBytes(4).toString("hex");
        const links=await getLinkByShortCode(finalShortCode);
        if(links){
            // return res.status(400).send(`<h1>Shortcode already exist. Try another..<a href='/'> Go Back </a></h1> `);
            req.flash(
                "errors",
                "Url with that shortcode already exists, please choose another"
              );
              return res.redirect("/");
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


// export const getShortenerEditPage=async(req,res)=>{
//     if(!req.user) return res.redirect("/login");
//     // const id=req.params;
//     const {data: id,error}=z.coerce.number().int().safeParse(req.params.id);
//     if(error) return res.redirect("/404");
//     try {
//         const shortLink =await findShortLinkById(id);
        
//         if(!shortLink) return res.redirect("/404");

//         res.render("edit-shortLink",{
//             id:shortLink.id,
//             url:shortLink.url,
//             shortCode:shortLink.shortCode,
//             errors:req.flash("errors"),
//         });
//         console.log(shortLink)
//     } catch (error) {
//         console.error(error);
//         return res.status(500).send("Internal Server Error");
//     }

// };

// export const postShortenerEditPage=async(req,res)=>{

//     if(!req.user) return res.redirect("/login");
//     // const id=req.params;
//     const {data: id,error}=z.coerce.number().int().safeParse(req.params.id);
//     if(error) return res.redirect("/404");
//     try {
//         const {url,shortCode}=req.body;
//         const newUpdatedShortCode =await updateShortCode(id,url,shortCode);
//         if(!newUpdatedShortCode) return res.redirect("/404");
//         res.redirect("/");

//     } catch (error) {
//         if (error.code === "ER_DUP_ENTRY") {
//             req.flash("errors", "Shortcode already exists, please choose another");
//             return res.redirect(`/edit/${id}`);
//           }
//         console.error(error);
//         return res.status(500).send("Internal Server Error");
//     }
// }

// // DeleteShort code

// export const deleteShortCode=async(req,res)=>{

//     if(!req.user) return res.redirect("/login");
//     // const id=req.params;
//     const {data: id,error}=z.coerce.number().int().safeParse(req.params.id);
//     if(error) return res.redirect("/404");
//     try {
//         const {data: id,error}=z.coerce.number().int().safeParse(req.params.id);
//     if(error) return res.redirect("/404");

//     await deleteShortCodeById(id);
//     return res.redirect("/");
//     } catch (error) {
//         if (error.code === "ER_DUP_ENTRY") {
//             req.flash("errors", "Shortcode already exists, please choose another");
//             return res.redirect(`/edit/${id}`);
//           }
//         console.error(error);
//         return res.status(500).send("Internal Server Error");
//     }
// }


// GET Edit Page
export const getShortenerEditPage = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const idSchema = z.string().length(24); // MongoDB ObjectId length
  const parseResult = idSchema.safeParse(req.params.id);
  if (!parseResult.success) return res.redirect("/404");

  const id = parseResult.data;

  try {
    const shortLink = await findShortLinkById(id);

    if (!shortLink) return res.redirect("/404");

    res.render("edit-shortLink", {
      id: shortLink._id,
      url: shortLink.url,
      shortCode: shortLink.short_code, // assuming your field name is short_code
      errors: req.flash("errors"),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};

// POST Edit Page
export const postShortenerEditPage = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const idSchema = z.string().length(24);
  const parseResult = idSchema.safeParse(req.params.id);
  if (!parseResult.success) return res.redirect("/404");

  const id = parseResult.data;

  try {
    const { url, shortCode } = req.body;
    const result = await updateShortCode(id, url, shortCode);

    if (result.matchedCount === 0) return res.redirect("/404");

    res.redirect("/");
  } catch (error) {
    if (error.code === 11000) {
      req.flash("errors", "Shortcode already exists, please choose another");
      return res.redirect(`/edit/${id}`);
    }
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};

// DELETE Short Code
export const deleteShortCode = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const idSchema = z.string().length(24);
  const parseResult = idSchema.safeParse(req.params.id);
  if (!parseResult.success) return res.redirect("/404");

  const id = parseResult.data;

  try {
    await deleteShortCodeById(id);
    return res.redirect("/");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};
