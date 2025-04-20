import { dbClient } from "../config/db-client.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import mjml2html from "mjml";
import { sendEmail } from "../lib/send-email.js";
import ejs from "ejs";
import { ObjectId } from "mongodb";
import { ACCESS_TOKEN_EXPIRY, MILLISECONDS_PER_SECOND, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";

const db = dbClient.db(process.env.MONGODB_DATABASE_NAME);
const usersCollection = db.collection("users");

// Get user by email
export const getUserByEmail = async (email) => {
  return await usersCollection.findOne({ email });
};

// Create new user
export const createUser = async ({ name, email, password }) => {
  try {
    const result = await usersCollection.insertOne({
      name,
      email,
      password,
      createdAt: new Date(),
      updatedAt: new Date()
    });

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

// Password functions
export const hashPassword = async (password) => await argon2.hash(password);
export const comparePassword = async (password, hash) => await argon2.verify(hash, password);

// Session creation
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

// JWT Tokens
export const createAccessToken = ({ id, name, email, sessionId }) =>
  jwt.sign({ id, name, email, sessionId }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND
  });

export const createRefreshToken = (sessionId) =>
  jwt.sign({ sessionId }, process.env.JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND
  });

export const verifyJWTToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

// Session/User helpers
export const findSessionById = async (sessionId) =>
  await db.collection("sessions").findOne({ _id: new ObjectId(sessionId) });

// export const findUserById = async (user_id) => {
//   const id = typeof user_id === "string" ? new ObjectId(user_id) : user_id;
//   return await usersCollection.findOne({ _id: id });
// };

export const findUserById = async (user_id) => {
  const id = typeof user_id === "string" ? new ObjectId(user_id) : user_id;
  return await usersCollection.findOne(
    { _id: id },
    {
      projection: {
        _id: 1,
        name: 1,
        email: 1,
        password:1,
        createdAt: 1,
        updatedAt:1,
        is_email_valid: 1,
      },
    }
  );
};


// Refresh tokens
export const refreshTokens = async (refreshToken) => {
  try {
    const decoded = verifyJWTToken(refreshToken);
    const session = await findSessionById(decoded.sessionId);
    if (!session || !session.valid) throw new Error("Invalid session");

    const user = await findUserById(session.user_id);
    if (!user) throw new Error("Invalid user");

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

// Clear user session
export const clearUserSession = async (sessionId) => {
  await db.collection("sessions").deleteOne({ _id: new ObjectId(sessionId) });
};

// Authenticate user
export const authenticateUser = async ({ req, res, user, name, email }) => {
  const sessionId = await createSession(user._id, {
    ip: req.clientIp,
    user_agent: req.headers["user-agent"]
  });

  const accessToken = createAccessToken({
    id: user._id,
    name: user.name || name,
    email: user.email || email,
    is_email_valid:false,
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

// Email verification logic
export const generateRandomToken = (digit = 4) => {
  const min = 10 ** (digit - 1);
  const max = 10 ** digit;
  return crypto.randomInt(min, max).toString();
};

export const insertVerifyEmailToken = async ({ userId, token }) => {
  const collection = db.collection("is_email_valid");
  const now = new Date();

  await collection.deleteMany({ user_id: new ObjectId(userId), expires_at: { $lt: now } });
  await collection.deleteMany({ user_id: new ObjectId(userId) });

  await collection.insertOne({
    user_id: new ObjectId(userId),
    token,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    created_at: new Date(),
  });
};

export const createVerifyEmailLink = async ({ email, token }) => {
  const url = new URL(`${process.env.FRONTEND_URL}/verify-email-token`);
  url.searchParams.append("token", token);
  url.searchParams.append("email", email);
  return url.toString();
};

export const findVerificationEmailToken = async ({ token, email }) => {
  const user = await usersCollection.findOne({ email });
  if (!user) return null;

  const tokenDoc = await db.collection("is_email_valid").findOne({
    user_id: user._id,
    token,
    expires_at: { $gte: new Date() }
  });

  if (!tokenDoc) return null;

  return {
    userId: user._id,
    email: user.email,
    token: tokenDoc.token,
    expiresAt: tokenDoc.expires_at,
  };
};

export const verifyUserEmailAndUpdate = async (email) =>
  await usersCollection.updateOne(
    { email },
    { $set: { is_email_valid: true } }
  );

export const clearVerifyEmailTokens = async (email) => {
  const user = await usersCollection.findOne({ email });
  if (!user) return;

  return await db.collection("is_email_valid").deleteMany({
    user_id: user._id,
  });
};

export const sendNewVerifyEmailLink = async ({ userId, email }) => {
  const randomToken = generateRandomToken();

  await insertVerifyEmailToken({ userId, token: randomToken });

  const verifyEmailLink = await createVerifyEmailLink({ email, token: randomToken });

  const mjmlTemplate = await fs.readFile(
    path.join(import.meta.dirname, "..", "emails", "verify-email.mjml"),
    "utf-8"
  );

  const filledTemplate = ejs.render(mjmlTemplate, {
    code: randomToken,
    link: verifyEmailLink,
  });

  const htmlOutput = mjml2html(filledTemplate).html;

  await sendEmail({
    to: email,
    subject: "Verify your email",
    html: htmlOutput,
  });
};

// updateUSerByName

export const updateUserByName = async (userId, name) => {
  const id = typeof userId === "string" ? new ObjectId(userId) : userId;
  return await usersCollection.updateOne(
    { _id: id },
    { $set: { name } }
  );
};

// updateUserPassword
// export const updateUserPassword = async (userId, newPassword) => {
//   const newHashPassword= await hashPassword(newPassword);
//   const id = typeof userId === "string" ? new ObjectId(userId) : userId;
//   return await usersCollection.updateOne(
//     { _id: id },
//     { $set: {password: newHashPassword } }
//   );
// };

export const updateUserPassword = async ({ userId, newPassword }) => {
  const id = typeof userId === "string" ? new ObjectId(userId) : userId;
  const newHashedPassword = await hashPassword(newPassword);

  return await usersCollection.updateOne(
    { _id: id },
    { $set: { password: newHashedPassword } }
  );
};


// 1. Find user by email
export const findUserByEmail = async (email) => {
  return await db.collection("users").findOne({ email });
};

// 2. Create password reset link
export const createResetPasswordLink = async ({ userId }) => {
  const randomToken = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(randomToken)
    .digest("hex");

  // Delete previous tokens for this user
  await db.collection("password_reset_tokens").deleteMany({
    user_id: new ObjectId(userId),
  });

  // Insert new token
  await db.collection("password_reset_tokens").insertOne({
    user_id: new ObjectId(userId),
    token_hash: tokenHash,
    created_at: new Date(),
    expires_at: new Date(Date.now() + 1000 * 60 * 60), // expires in 1 hour
  });

  return `${process.env.FRONTEND_URL}/reset-password/${randomToken}`;
};

// 3. Get reset password token data
export const getResetPasswordToken = async (token) => {
  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  return await db.collection("password_reset_tokens").findOne({
    token_hash: tokenHash,
    expires_at: { $gte: new Date() },
  });
};

// 4. Clear token after password reset
export const clearResetPasswordToken = async (userId) => {
  await db.collection("password_reset_tokens").deleteMany({
    user_id: new ObjectId(userId),
  });
};