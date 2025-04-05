import { MongoClient } from "mongodb";
import {env} from "./env.js";
export const dbClient=new MongoClient(env.MONGODB_URL);

export const connectToDB = async () => {
    try {
      await dbClient.connect();
      console.log("✅ Connected to MongoDB!");
    } catch (err) {
      console.error("❌ Failed to connect:", err.message);
      process.exit(1);
    }
  };