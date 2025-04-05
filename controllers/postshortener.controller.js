import crypto from "crypto";
import { loadLinks, saveLinks, getLinkByShortCode } from "../models/shortener.model.js";

export const getShortenerPage = async (req, res) => {
  try {
    const links = await loadLinks();
    return res.render("index", { links, host: req.headers.host });
  } catch (error) {
    console.error("Error loading page:", error);
    return res.status(500).send("Internal Server Error");
  }
};

export const postURLShortener = async (req, res) => {
  try {
    const { url, shortCode } = req.body;
    const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

    const existing = await getLinkByShortCode(finalShortCode);
    if (existing) {
      return res.status(400).send("Short code already exists. Please choose another");
    }

    await saveLinks({ url, shortCode: finalShortCode });
    return res.redirect("/");
  } catch (error) {
    console.error("Error shortening URL:", error);
    return res.status(500).send("Internal Server Error");
  }
};

export const redirectToShortLink = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const link = await getLinkByShortCode(shortCode);

    if (!link) return res.status(404).send("404 error occurred.");
    return res.redirect(link.url);
  } catch (error) {
    console.error("Error redirecting:", error);
    return res.status(500).send("Internal server error");
  }
};
