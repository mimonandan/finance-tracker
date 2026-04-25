// app/api/health/route.js - Controllers for the health check endpoints, utilizing the health service to provide responses.
// Controller → handles HTTP requests and responses.
import { addExpense, getExpenses } from '@/services/expenseService';

export async function GET(request) {
  try {
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
    };

    const result = await getExpenses(query);

    return Response.json({
      success: true,
      data: result,
      error: null
    });

  } catch (error) {
    console.error("GET Expense Error:", error);

    return Response.json(
      { success: false, data: null, error: error.message },
      { status: 400 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await addExpense(body);

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}