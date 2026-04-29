import { logoutUser } from '@/services/authService';

export async function POST(request) {
  try {
    const { refreshToken } = await request.json();

    const result = await logoutUser(refreshToken);

    return Response.json({
      success: true,
      data: result,
      error: null
    });

  } catch (error) {
    return Response.json(
      {
        success: false,
        data: null,
        error: error.message   // IMPORTANT
      },
      { status: 400 }
    );
  }
}