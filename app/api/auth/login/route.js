import { loginUser } from '@/services/authService';

export async function POST(request) {
  try {
    const body = await request.json();

    const result = await loginUser(body);

    return Response.json({
      success: true,
      data: result,
      error: null
    });

  } catch (error) {
    return Response.json(
      { success: false, data: null, error: error.message },
      { status: 401 }
    );
  }
}