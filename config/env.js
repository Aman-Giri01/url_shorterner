import dotenv from "dotenv";
dotenv.config();
import {z} from "zod";

export const env =z.object({
    PORT:z.coerce.number().default(3000),
    MONGODB_URL:z.string(),
    MONGODB_DATABASE_NAME:z.string(),
}).parse(process.env);



