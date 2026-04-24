// app/api/health/route.js - Controllers for the health check endpoints, utilizing the health service to provide responses.
// Controller → handles HTTP requests and responses.
import { addExpense, getExpenses } from '@/services/expenseService';

export async function GET() {
  try {
    const data = getExpenses();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = addExpense(body);

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}