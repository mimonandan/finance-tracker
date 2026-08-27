import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const ACCESS_SECRET =
  process.env.ACCESS_SECRET || "access_secret";

const REFRESH_SECRET =
  process.env.REFRESH_SECRET || "refresh_secret";


// =========================
// PASSWORD VALIDATION
// =========================

function validatePassword(password) {

  if (!password) {
    throw new Error("Password is required");
  }

  if (password.length < 8) {
    throw new Error(
      "Password must be at least 8 characters long"
    );
  }

  if (!/[A-Z]/.test(password)) {
    throw new Error(
      "Password must contain at least one uppercase letter"
    );
  }

  if (!/[a-z]/.test(password)) {
    throw new Error(
      "Password must contain at least one lowercase letter"
    );
  }

  if (!/[0-9]/.test(password)) {
    throw new Error(
      "Password must contain at least one number"
    );
  }

  if (!/[!@#$%^&*(),.?":{}|<>_\-\\[\]/;'+=~`]/.test(password)) {
    throw new Error(
      "Password must contain at least one special character"
    );
  }

  return true;
}


// =========================
// REGISTER USER
// =========================

export async function registerUser(data) {

  const {
    name,
    email,
    password
  } = data;

  if (!name || !name.trim()) {
    throw new Error("Name is required");
  }

  const normalizedName =
    name.trim();

  if (normalizedName.length < 2) {
    throw new Error(
      "Name must be at least 2 characters long"
    );
  }

  if (!email || !email.trim()) {
    throw new Error("Email is required");
  }

  const normalizedEmail =
    email.trim().toLowerCase();

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalizedEmail)) {
    throw new Error(
      "Please enter a valid email address"
    );
  }

  validatePassword(password);

  const existingUser =
    await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      }
    });

  if (existingUser) {
    throw new Error(
      "User already exists"
    );
  }

  const hashedPassword =
    await bcrypt.hash(password, 10);

  const user =
    await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword
      }
    });

  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}


// =========================
// LOGIN USER
// =========================

export async function loginUser(data) {

  const {
    email,
    password
  } = data;

  if (!email || !email.trim()) {
    throw new Error(
      "Email is required"
    );
  }

  if (!password) {
    throw new Error(
      "Password is required"
    );
  }

  const normalizedEmail =
    email.trim().toLowerCase();

  const user =
    await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      }
    });

  if (!user) {
    throw new Error(
      "Invalid credentials"
    );
  }

  const isMatch =
    await bcrypt.compare(
      password,
      user.password
    );

  if (!isMatch) {
    throw new Error(
      "Invalid credentials"
    );
  }

  // Remove previous sessions

  await prisma.refreshToken.deleteMany({
    where: {
      userId: user.id
    }
  });

  // Access token

  const accessToken =
    jwt.sign(
      {
        userId: user.id,
        name: user.name,
        role: user.role
      },
      ACCESS_SECRET,
      {
        expiresIn: "15m"
      }
    );

  // Refresh token

  const refreshToken =
    jwt.sign(
      {
        userId: user.id,
        name: user.name,
        role: user.role
      },
      REFRESH_SECRET,
      {
        expiresIn: "7d"
      }
    );

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(
        Date.now() +
        7 * 24 * 60 * 60 * 1000
      )
    }
  });

  return {
    accessToken,
    refreshToken,
    name: user.name,
    role: user.role
  };
}


// =========================
// REFRESH ACCESS TOKEN
// =========================

export async function refreshAccessToken(
  refreshToken
) {

  if (!refreshToken) {
    throw new Error(
      "Refresh token required"
    );
  }

  const existingToken =
    await prisma.refreshToken.findUnique({
      where: {
        token: refreshToken
      }
    });

  if (!existingToken) {
    throw new Error(
      "Invalid refresh token"
    );
  }

  if (
    existingToken.expiresAt <
    new Date()
  ) {

    await prisma.refreshToken.delete({
      where: {
        token: refreshToken
      }
    });

    throw new Error(
      "Refresh token expired"
    );
  }

  let decoded;

  try {

    decoded =
      jwt.verify(
        refreshToken,
        REFRESH_SECRET
      );

  } catch (e) {

    await prisma.refreshToken.delete({
      where: {
        token: refreshToken
      }
    });

    throw new Error(
      "Invalid refresh token"
    );
  }

  // Rotate old refresh token

  await prisma.refreshToken.delete({
    where: {
      token: refreshToken
    }
  });

  const newAccessToken =
    jwt.sign(
      {
        userId: decoded.userId,
        name: decoded.name,
        role: decoded.role
      },
      ACCESS_SECRET,
      {
        expiresIn: "15m"
      }
    );

  const newRefreshToken =
    jwt.sign(
      {
        userId: decoded.userId,
        name: decoded.name,
        role: decoded.role
      },
      REFRESH_SECRET,
      {
        expiresIn: "7d"
      }
    );

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: decoded.userId,
      expiresAt: new Date(
        Date.now() +
        7 * 24 * 60 * 60 * 1000
      )
    }
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    name: decoded.name,
    role: decoded.role
  };
}


// =========================
// FORGOT PASSWORD
// =========================

export async function forgotPassword(email) {

  if (!email || !email.trim()) {
    throw new Error(
      "Email is required"
    );
  }

  const normalizedEmail =
    email.trim().toLowerCase();

  const user =
    await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      }
    });

  /*
   * IMPORTANT:
   *
   * In production, don't reveal whether
   * an email exists.
   *
   * For our development project we are
   * returning the reset token so that
   * we can test the complete flow without
   * an email provider.
   */

  if (!user) {
    return {
      message:
        "If an account exists with this email, a password reset request has been created."
    };
  }

  // Remove previous reset tokens

  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id
    }
  });

  // Generate cryptographically secure token

  const resetToken =
    crypto.randomBytes(32).toString("hex");

  // Hash token before storing

  const tokenHash =
    crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

  // Token expires in 15 minutes

  const expiresAt =
    new Date(
      Date.now() +
      15 * 60 * 1000
    );

  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt
    }
  });

  return {
    message:
      "Password reset token generated successfully.",

    // Development only.
    // In production this should be sent
    // through email instead.
    resetToken
  };
}


// =========================
// RESET PASSWORD
// =========================

export async function resetPassword(
  resetToken,
  newPassword
) {

  if (!resetToken) {
    throw new Error(
      "Reset token is required"
    );
  }

  // Validate new password

  validatePassword(newPassword);

  // Hash the received reset token

  const tokenHash =
    crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

  // Find reset token

  const passwordResetToken =
    await prisma.passwordResetToken.findUnique({
      where: {
        tokenHash
      }
    });

  if (!passwordResetToken) {
    throw new Error(
      "Invalid or expired reset token"
    );
  }

  // Check expiry

  if (
    passwordResetToken.expiresAt <
    new Date()
  ) {

    await prisma.passwordResetToken.delete({
      where: {
        id: passwordResetToken.id
      }
    });

    throw new Error(
      "Reset token expired"
    );
  }

  // Hash new password

  const hashedPassword =
    await bcrypt.hash(
      newPassword,
      10
    );

  // Update password

  await prisma.user.update({
    where: {
      id: passwordResetToken.userId
    },
    data: {
      password: hashedPassword
    }
  });

  // IMPORTANT:
  // Invalidate all existing sessions

  await prisma.refreshToken.deleteMany({
    where: {
      userId: passwordResetToken.userId
    }
  });

  // Delete reset token
  // This makes it one-time use

  await prisma.passwordResetToken.delete({
    where: {
      id: passwordResetToken.id
    }
  });

  return {
    message:
      "Password reset successfully. Please login again."
  };
}


// =========================
// LOGOUT USER
// =========================

export async function logoutUser(
  refreshToken
) {

  if (!refreshToken) {
    throw new Error(
      "Refresh token required"
    );
  }

  const existingToken =
    await prisma.refreshToken.findUnique({
      where: {
        token: refreshToken
      }
    });

  if (!existingToken) {
    throw new Error(
      "Invalid refresh token"
    );
  }

  await prisma.refreshToken.delete({
    where: {
      token: refreshToken
    }
  });

  return "Logged out successfully";
}