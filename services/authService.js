import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';

const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";

export async function loginUser(data) {
  const { email, password } = data;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) throw new Error("Invalid credentials");

  // Access token 
  const accessToken = jwt.sign(
    { userId: user.id },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  // Refresh token 
  const refreshToken = jwt.sign(
    { userId: user.id },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return {
    accessToken,
    refreshToken
  };
}