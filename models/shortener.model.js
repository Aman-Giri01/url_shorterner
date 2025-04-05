import { dbClient } from "../config/db-client.js";
import { env } from "../config/env.js";

const db=dbClient.db(env.MONGODB_DATABASE_NAME);

const shortenerCollection= db.collection('url');

export const loadLinks= async ()=>{
  return shortenerCollection.find().toArray();
};

export const saveLinks=async(links)=>{
  return shortenerCollection.insertOne(links);
};

export const getLinkByShortCode=async(shortCode)=>{
  return shortenerCollection.findOne({shortCode:shortCode});
};

