import { Google } from "arctic";
import { env } from "../../config/env.js";

const redirectUri = process.env.FRONTEND_URL.includes("localhost")
  ? "http://localhost:3000/google/callback"
  : "https://url-shorterner-lop6.onrender.com/google/callback";


export const google= new Google(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    redirectUri
);