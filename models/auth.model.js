// import { db } from "../config/db-client.js";
// import argon2  from "argon2";
// import jwt from "jsonwebtoken";

// export const getUserByEmail=async(email)=>{
//     const [user]= await db.query("SELECT * FROM users WHERE email = ?", [email]);
//     return user[0];

// }

// export const createUser = async ({ name, email, password }) => {
//     try {
//       const [result] = await db.execute(
//         "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
//         [name, email, password]
//       );
//       console.log("Insert result:", result); // log result to confirm insert
//       return [result];
//     } catch (error) {
//       console.error("Insert error:", error); // log exact SQL error
//       throw error;
//     }
//   };
  
//   export const hashPassword= async(password)=>{
//     return await argon2.hash(password);

//   };

//   export const comparePassword= async(password,hash)=>{
//     return await argon2.verify(hash,password);
//   }
  
//   // Generate JWT token
//   export const generateToken=({id,name,email})=>{
//     return jwt.sign({id,name,email},process.env.JWT_SECRET,{
//       expiresIn:"30d",
//     });

//   } 

//   // verifyJWT Token

//   export const verifyJWTToken=(token)=>{
//     return jwt.verify(token,process.env.JWT_SECRET);
//   }

import { dbClient } from "../config/db-client.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

const db = dbClient.db(process.env.MONGODB_DATABASE_NAME);
const usersCollection = db.collection("users");

// Get user by email
export const getUserByEmail = async (email) => {
  return await usersCollection.findOne({ email });
};

// Create user
export const createUser = async ({ name, email, password }) => {
  try {
    const result = await usersCollection.insertOne({
      name,
      email,
      password,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return result;
  } catch (error) {
    console.error("Insert error:", error);
    throw error;
  }
};

// Hash password
export const hashPassword = async (password) => {
  return await argon2.hash(password);
};

// Compare password
export const comparePassword = async (password, hash) => {
  return await argon2.verify(hash, password);
};

// Generate JWT

// export const generateToken = ({ _id, name, email }) => {
//   return jwt.sign({ id: _id.toString(), name, email }, process.env.JWT_SECRET, {
//     expiresIn: "30d"
//   });
// };

export const generateToken = (user) => {
  if (!user._id) throw new Error("Missing _id in user object");

  return jwt.sign(
    {
      id: user._id.toString(), // safer
      name: user.name,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};


// Verify JWT
export const verifyJWTToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
