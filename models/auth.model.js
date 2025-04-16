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
import { ACCESS_TOKEN_EXPIRY, MILLISECONDS_PER_SECOND, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";

const db = dbClient.db(process.env.MONGODB_DATABASE_NAME);
const usersCollection = db.collection("users");

// Get user by email
export const getUserByEmail = async (email) => {
  return await usersCollection.findOne({ email });
};

// Create user
// export const createUser = async ({ name, email, password }) => {
//   try {
//     const result = await usersCollection.insertOne({
//       name,
//       email,
//       password,
//       createdAt: new Date(),
//       updatedAt: new Date()
//     });
//     return result;
//   } catch (error) {
//     console.error("Insert error:", error);
//     throw error;
//   }
// };

export const createUser = async ({ name, email, password }) => {
  try {
    const result = await usersCollection.insertOne({
      name,
      email,
      password,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Return the complete user object with the generated _id
    return {
      _id: result.insertedId,
      name,
      email,
      password,
    };
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

// export const generateToken = (user) => {
//   if (!user._id) throw new Error("Missing _id in user object");

//   return jwt.sign(
//     {
//       id: user._id.toString(), // safer
//       name: user.name,
//       email: user.email
//     },
//     process.env.JWT_SECRET,
//     { expiresIn: "30d" }
//   );
// };


// // Verify JWT
// export const verifyJWTToken = (token) => {
//   return jwt.verify(token, process.env.JWT_SECRET);
// };

// Create Session
export const createSession = async (user_id, { ip, user_agent }) => {
  const session = {
    user_id: new ObjectId(user_id),
    valid: true,
    user_agent: user_agent || null,
    ip: ip || null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await db.collection("sessions").insertOne(session);
  return result.insertedId;
};

// JWT Token Creation
export const createAccessToken = ({ id, name, email, sessionId }) => {
  return jwt.sign({ id, name, email, sessionId }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND
  });
};

export const createRefreshToken = (sessionId) => {
  return jwt.sign({ sessionId }, process.env.JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND
  });
};

// Verify Token
export const verifyJWTToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Find Session by ID
export const findSessionById = async (sessionId) => {
  return await db.collection("sessions").findOne({ _id: new ObjectId(sessionId) });
};
// find user bt id
export const findUserById = async (user_id) => {
  const id = typeof user_id === "string" ? new ObjectId(user_id) : user_id;
  return await db.collection("users").findOne({ _id: id });
};



// Refresh Tokens
export const refreshTokens = async (refreshToken) => {
  try {
    const decoded = verifyJWTToken(refreshToken);
    const session = await findSessionById(decoded.sessionId);

    if (!session || !session.valid) {
      throw new Error("Invalid session");
    }

    const user = await findUserById(session.user_id);
    console.log("Decoded session.user_id:", session.user_id);

    if (!user) {
      throw new Error("Invalid user");
    }

    const userInfo = {
      id: user._id,
      name: user.name,
      email: user.email,
      sessionId: session._id
    };

    const newaccessToken = createAccessToken(userInfo);
    const newrefreshToken = createRefreshToken(session._id);

    return {
      newaccessToken,
      newrefreshToken,
      user: userInfo
    };
  } catch (err) {
    console.log(err.message);
    return null;
  }
};

// Delete Session
export const clearUserSession = async (sessionId) => {
  await db.collection("sessions").deleteOne({ _id: new ObjectId(sessionId) });
};

// Authenticate User
export const authenticateUser = async ({ req, res, user, name, email }) => {
  const sessionId = await createSession(user._id, {
    ip: req.clientIp,
    user_agent: req.headers["user-agent"]
  });

  const accessToken = createAccessToken({
    id: user._id,
    name: user.name || name,
    email: user.email || email,
    sessionId
  });

  const refreshToken = createRefreshToken(sessionId);

  const baseConfig = { httpOnly: true, secure: true };

  res.cookie("access_token", accessToken, {
    ...baseConfig,
    maxAge: ACCESS_TOKEN_EXPIRY
  });

  res.cookie("refresh_token", refreshToken, {
    ...baseConfig,
    maxAge: REFRESH_TOKEN_EXPIRY
  });
};


//  get all short links

// export const getAllShortLinks = async (userId) => {
//   // console.log("Finding links for user:", userId);
//   return db.collection('url').find({ userId: new ObjectId(userId) }).toArray();

// };