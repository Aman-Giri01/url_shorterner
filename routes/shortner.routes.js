import { postURLShortener, getShortenerPage,redirectToShortLink ,getShortenerEditPage,postShortenerEditPage,deleteShortCode} from "../controllers/postshortener.controller.js";
import {Router} from "express";

const router=Router();

router.get("/", getShortenerPage);

router.post("/",postURLShortener);

router.get("/:shortCode",redirectToShortLink);

router
.route("/edit/:id")
.get(getShortenerEditPage)
.post(postShortenerEditPage);


router
.route('/delete/:id')
.post(deleteShortCode);

// export default router;

// Named exports

export const shortenerRoutes=router;
