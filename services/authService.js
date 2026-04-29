import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';

const ACCESS_SECRET = process.env.ACCESS_SECRET || "access_secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh_secret";


// REGISTER USER
export async function registerUser(data) {
  const { name, email, password } = data;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword
    }
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}


// LOGIN USER
export async function loginUser(data) {
  const { email, password } = data;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  // Remove old sessions
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id }
  });

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  return {
    accessToken,
    refreshToken
  };
}


// REFRESH ACCESS TOKEN
export async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new Error("Refresh token required");
  }

  // Step 1 — Check token exists in DB
  const existingToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken }
  });

  if (!existingToken) {
    throw new Error("Invalid refresh token");
  }

  // Step 2 — Check DB expiry
  if (existingToken.expiresAt < new Date()) {
    // cleanup expired token
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    throw new Error("Refresh token expired");
  }

  // Step 3 — Verify JWT
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, REFRESH_SECRET);
  } catch (e) {
    // cleanup if JWT invalid/tampered
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    throw new Error("Invalid refresh token");
  }

  // Step 4 — ROTATION: delete old token
  await prisma.refreshToken.delete({
    where: { token: refreshToken }
  });

  // Step 5 — Issue new tokens
  const newAccessToken = jwt.sign(
    { userId: decoded.userId, role: decoded.role },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  const newRefreshToken = jwt.sign(
    { userId: decoded.userId },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  // Step 6 — Store new refresh token
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: decoded.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
}


// LOGOUT USER
export async function logoutUser(refreshToken) {
  if (!refreshToken) {
    throw new Error("Refresh token required");
  }

  // Step 1 — Check if token exists
  const existingToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken }
  });

  if (!existingToken) {
    throw new Error("Invalid refresh token");
  }

  // Step 2 — Delete token
  await prisma.refreshToken.delete({
    where: { token: refreshToken }
  });

  return "Logged out successfully";
}