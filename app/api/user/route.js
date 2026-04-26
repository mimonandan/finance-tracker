import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();

    const user = await prisma.user.create({
      data: body
    });

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