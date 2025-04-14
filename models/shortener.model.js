// import { dbClient } from "../config/db-client.js";
// import { env } from "../config/env.js";

// const db=dbClient.db(env.MONGODB_DATABASE_NAME);

// const shortenerCollection= db.collection('url');

// export const loadLinks= async ()=>{
//   return shortenerCollection.find().toArray();
// };

// export const saveLinks=async(links)=>{
//   return shortenerCollection.insertOne(links);
// };

// export const getLinkByShortCode=async(shortCode)=>{
//   return shortenerCollection.findOne({shortCode:shortCode});
// };

import { dbClient } from "../config/db-client.js";
import { env } from "../config/env.js";
import { ObjectId } from "mongodb";

const db = dbClient.db(env.MONGODB_DATABASE_NAME);
const shortenerCollection = db.collection('url');

export const loadLinks = async (userId) => {
  // console.log("Finding links for user:", userId);
  return shortenerCollection.find({ userId: new ObjectId(userId) }).toArray();

};

export const saveLinks = async (data) => {
  return shortenerCollection.insertOne({
    ...data,
    userId: new ObjectId(data.userId),
    createdAt: new Date(),
    updatedAt: new Date()
  });
};

export const getLinkByShortCode = async (shortCode) => {
  return shortenerCollection.findOne({ shortCode });
};
