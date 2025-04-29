import { Google } from "arctic";
import { env } from "../../config/env.js";

const redirectUri =
  process.env.NODE_ENV === "production"
    ? "https://yourwebsite.com/google/callback"
    : "http://localhost:3000/google/callback";

export const google= new Google(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    redirectUri
);