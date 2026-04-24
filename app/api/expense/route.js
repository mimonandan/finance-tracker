// app/api/health/route.js - Controllers for the health check endpoints, utilizing the health service to provide responses.
// Controller → handles HTTP requests and responses.
import { addExpense, getExpenses } from '@/services/expenseService';

export async function GET() {
  const data = getExpenses();
  return Response.json(data);
}

export async function POST(request) {
  const body = await request.json();
  const result = addExpense(body);
  return Response.json(result);
}