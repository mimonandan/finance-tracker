import { registerUser } from '@/services/authService';

export async function POST(request) {
  try {
    const body = await request.json();

    const user = await registerUser(body);

    return Response.json({
      success: true,
      data: user,
      error: null
    });

  } catch (error) {
    return Response.json(
      { success: false, data: null, error: error.message },
      { status: 400 }
    );
  }
}