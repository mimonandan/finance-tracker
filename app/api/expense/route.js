import { addExpense, getExpenses } from '@/services/expenseService';
import { verifyToken } from '@/lib/authMiddleware';

// GET
export async function GET(request) {
  try {
    const user = verifyToken(request);

    const { searchParams } = new URL(request.url);

    const query = {
      category: searchParams.get("category"),
      minAmount: searchParams.get("minAmount"),
      maxAmount: searchParams.get("maxAmount"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      sortBy: searchParams.get("sortBy"),
      order: searchParams.get("order"),
      userId: user.role === "ADMIN" ? undefined : user.userId
    };

    const result = await getExpenses(query);

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

// POST
export async function POST(request) {
  try {
    const user = verifyToken(request);
    //console.log("User in route:", user);

    const body = await request.json();

//     console.log("Payload to service:", {
//   ...body,
//   userId: user.userId
// });

    const result = await addExpense({
      ...body,
      userId: user.userId
    });
    
    return Response.json({
      success: true,
      data: result,
      error: null
    });

  } catch (error) {
    return Response.json(
      { success: false, data: null, error: error.message },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}