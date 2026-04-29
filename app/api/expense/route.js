// app/api/health/route.js - Controllers for the health check endpoints, utilizing the health service to provide responses.
// Controller → handles HTTP requests and responses.
import { addExpense, getExpenses } from '@/services/expenseService';
import { verifyToken } from '@/lib/authMiddleware';

export async function GET(request) {
  try {
    const user = verifyToken(request); // verify token and get user information

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

export async function POST(request) {
  try {
    const user = verifyToken(request); // verify token and get user information

    const body = await request.json();

    const result = await addExpense({
      ...body,
      userId: user.userId  // associate expense with the authenticated user
    });

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