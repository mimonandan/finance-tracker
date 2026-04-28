import jwt from 'jsonwebtoken';

const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";

export async function POST(request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      throw new Error("Refresh token required");
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    return Response.json({
      success: true,
      data: { accessToken: newAccessToken },
      error: null
    });

  } catch (error) {
    return Response.json(
      { success: false, data: null, error: "Invalid refresh token" },
      { status: 401 }
    );
  }
}