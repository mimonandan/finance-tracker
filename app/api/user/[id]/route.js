import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params; 
    const userId = parseInt(resolvedParams.id);

const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    email: true,
    _count: {
      select: {
        expenses: true,
        loans: true
      }
    },
    expenses: {
      take: 5,
      orderBy: { createdAt: 'desc' }
    },
    loans: {
      take: 5,
      orderBy: { createdAt: 'desc' }
    }
  }
});

    if (!user) {
      return Response.json(
        { success: false, data: null, error: "User not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: user,
      error: null
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { success: false, data: null, error: error.message },
      { status: 500 }
    );
  }
}