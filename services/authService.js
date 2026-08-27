import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";

const ACCESS_SECRET =
  process.env.ACCESS_SECRET || "access_secret";

const REFRESH_SECRET =
  process.env.REFRESH_SECRET || "refresh_secret";


// ======================================================
// PASSWORD VALIDATION
// ======================================================

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


// ======================================================
// REGISTER USER
// ======================================================

export async function registerUser(data) {

  const {
    name,
    email,
    password
  } = data;


  // ------------------------------
  // NAME VALIDATION
  // ------------------------------

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


  // ------------------------------
  // EMAIL VALIDATION
  // ------------------------------

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


  // ------------------------------
  // PASSWORD VALIDATION
  // ------------------------------

  validatePassword(password);


  // ------------------------------
  // CHECK EXISTING USER
  // ------------------------------

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


  // ------------------------------
  // HASH PASSWORD
  // ------------------------------

  const hashedPassword =
    await bcrypt.hash(
      password,
      10
    );


  // ------------------------------
  // CREATE USER
  // ------------------------------

  const user =
    await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword
      }
    });


  // ------------------------------
  // RESPONSE
  // ------------------------------

  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}


// ======================================================
// LOGIN USER
// ======================================================

export async function loginUser(data) {

  const {
    email,
    password
  } = data;


  // ------------------------------
  // VALIDATION
  // ------------------------------

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


  // ------------------------------
  // FIND USER
  // ------------------------------

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


  // ------------------------------
  // CHECK PASSWORD
  // ------------------------------

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


  // ------------------------------
  // REMOVE OLD SESSIONS
  // ------------------------------

  await prisma.refreshToken.deleteMany({
    where: {
      userId: user.id
    }
  });


  // ------------------------------
  // ACCESS TOKEN
  // ------------------------------

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


  // ------------------------------
  // REFRESH TOKEN
  // ------------------------------

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


  // ------------------------------
  // STORE REFRESH TOKEN
  // ------------------------------

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


  // ------------------------------
  // RESPONSE
  // ------------------------------

  return {
    accessToken,
    refreshToken,
    userId: user.id,
    name: user.name,
    role: user.role
  };
}


// ======================================================
// REFRESH ACCESS TOKEN
// ======================================================

export async function refreshAccessToken(
  refreshToken
) {

  // ------------------------------
  // CHECK REFRESH TOKEN
  // ------------------------------

  if (!refreshToken) {
    throw new Error(
      "Refresh token required"
    );
  }


  // ------------------------------
  // CHECK DATABASE
  // ------------------------------

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


  // ------------------------------
  // CHECK DATABASE EXPIRY
  // ------------------------------

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


  // ------------------------------
  // VERIFY JWT
  // ------------------------------

  let decoded;

  try {

    decoded =
      jwt.verify(
        refreshToken,
        REFRESH_SECRET
      );

  } catch (error) {

    // Token is invalid/tampered.
    // Remove it from DB.

    await prisma.refreshToken.delete({
      where: {
        token: refreshToken
      }
    });

    throw new Error(
      "Invalid refresh token"
    );
  }


  // ------------------------------
  // ROTATE REFRESH TOKEN
  // ------------------------------

  await prisma.refreshToken.delete({
    where: {
      token: refreshToken
    }
  });


  // ------------------------------
  // NEW ACCESS TOKEN
  // ------------------------------

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


  // ------------------------------
  // NEW REFRESH TOKEN
  // ------------------------------

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


  // ------------------------------
  // STORE NEW REFRESH TOKEN
  // ------------------------------

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


  // ------------------------------
  // RESPONSE
  // ------------------------------

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    userId: decoded.userId,
    name: decoded.name,
    role: decoded.role
  };
}


// ======================================================
// FORGOT PASSWORD
// ======================================================

export async function forgotPassword(
  email
) {

  // ------------------------------
  // VALIDATION
  // ------------------------------

  if (!email || !email.trim()) {
    throw new Error(
      "Email is required"
    );
  }


  const normalizedEmail =
    email.trim().toLowerCase();


  // ------------------------------
  // FIND USER
  // ------------------------------

  const user =
    await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      }
    });


  /*
   * Do not reveal whether an email
   * exists in production.
   */

  if (!user) {

    return {
      message:
        "If an account exists with this email, a password reset request has been created."
    };
  }


  // ------------------------------
  // REMOVE OLD RESET TOKENS
  // ------------------------------

  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id
    }
  });


  // ------------------------------
  // GENERATE RESET TOKEN
  // ------------------------------

  const resetToken =
    crypto
      .randomBytes(32)
      .toString("hex");


  // ------------------------------
  // HASH RESET TOKEN
  // ------------------------------

  const tokenHash =
    crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");


  // ------------------------------
  // EXPIRY
  // ------------------------------

  const expiresAt =
    new Date(
      Date.now() +
      15 * 60 * 1000
    );


  // ------------------------------
  // STORE HASH
  // ------------------------------

  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt
    }
  });


  // ------------------------------
  // RESPONSE
  // ------------------------------

  return {
    message:
      "Password reset token generated successfully.",

    /*
     * DEVELOPMENT ONLY.
     *
     * Remove resetToken from the response
     * when email delivery is implemented.
     */

    resetToken
  };
}


// ======================================================
// RESET PASSWORD
// ======================================================

export async function resetPassword(
  resetToken,
  newPassword
) {

  // ------------------------------
  // TOKEN VALIDATION
  // ------------------------------

  if (!resetToken) {
    throw new Error(
      "Reset token is required"
    );
  }


  // ------------------------------
  // PASSWORD VALIDATION
  // ------------------------------

  validatePassword(
    newPassword
  );


  // ------------------------------
  // HASH RESET TOKEN
  // ------------------------------

  const tokenHash =
    crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");


  // ------------------------------
  // FIND TOKEN
  // ------------------------------

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


  // ------------------------------
  // CHECK EXPIRY
  // ------------------------------

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


  // ------------------------------
  // HASH NEW PASSWORD
  // ------------------------------

  const hashedPassword =
    await bcrypt.hash(
      newPassword,
      10
    );


  // ------------------------------
  // UPDATE PASSWORD
  // ------------------------------

  await prisma.user.update({
    where: {
      id: passwordResetToken.userId
    },

    data: {
      password: hashedPassword
    }
  });


  // ------------------------------
  // INVALIDATE ALL SESSIONS
  // ------------------------------

  await prisma.refreshToken.deleteMany({
    where: {
      userId:
        passwordResetToken.userId
    }
  });


  // ------------------------------
  // DELETE USED RESET TOKEN
  // ------------------------------

  await prisma.passwordResetToken.delete({
    where: {
      id: passwordResetToken.id
    }
  });


  // ------------------------------
  // RESPONSE
  // ------------------------------

  return {
    message:
      "Password reset successfully. Please login again."
  };
}


// ======================================================
// LOGOUT USER
// ======================================================

export async function logoutUser(
  refreshToken
) {

  // ------------------------------
  // VALIDATION
  // ------------------------------

  if (!refreshToken) {
    throw new Error(
      "Refresh token required"
    );
  }


  // ------------------------------
  // FIND TOKEN
  // ------------------------------

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


  // ------------------------------
  // DELETE TOKEN
  // ------------------------------

  await prisma.refreshToken.delete({
    where: {
      token: refreshToken
    }
  });


  // ------------------------------
  // RESPONSE
  // ------------------------------

  return {
    message:
      "Logged out successfully"
  };
}