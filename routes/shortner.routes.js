import { postURLShortener, getShortenerPage,redirectToShortLink } from "../controllers/postshortener.controller.js";
import {Router} from "express";

const router=Router();

router.get("/report",(req,res)=>{
    const student=[
    {name:"Aman",class:"10",roll:4},
    {name:"Ram",class:"10",roll:44},
    {name:"Kunal",class:"10",roll:32},
    {name:"Ramesh",class:"10",roll:25}

];
    res.render("report",{student});

});

router.get("/", getShortenerPage);

router.post("/",postURLShortener);

router.get("/:shortCode",redirectToShortLink);

// export default router;

// Named exports

export const shortenerRoots=router;
