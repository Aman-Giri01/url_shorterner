import { postURLShortener, getShortenerPage,redirectToShortLink } from "../controllers/postshortener.controller.js";
import {Router} from "express";

const router=Router();

router.get("/", getShortenerPage);

router.post("/",postURLShortener);

router.get("/:shortCode",redirectToShortLink);

// export default router;

// Named exports

export const shortenerRoots=router;
