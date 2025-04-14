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


// find link by id

export const findShortLinkById = async (id) => {
  try {
    const shortLink = await db.collection("url").findOne({ _id: new ObjectId(id) });
    return shortLink;
  } catch (error) {
    console.error("Error in findShortLinkById:", error);
    return null;
  }
};

// update short link

export const updateShortCode = async (id, url, shortCode) => {
  try {
    const result = await db.collection("url").updateOne(
      { _id: new ObjectId(id) },
      { $set: { url, shortCode } }
    );
    return result;
  } catch (error) {
    console.error("Error in updateShortCode:", error);
    return null;
  }
};


// delete short link

export const deleteShortCodeById = async (id) => {
  try {
    const result = await db.collection("url").deleteOne({ _id: new ObjectId(id) });
    return result;
  } catch (error) {
    console.error("Error in deleteShortCodeById:", error);
    return null;
  }
};

