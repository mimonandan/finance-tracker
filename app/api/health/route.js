// app/api/health/route.js - Controllers for the health check endpoints, utilizing the health service to provide responses.
// Controller → handles HTTP requests and responses.
import { getHealth, createHealth } from "@/services/healthService";

export async function GET() {
  const healthData = getHealth();
  return Response.json(healthData);
}

export async function POST(request) {
  const body = await request.json();
  const healthData = createHealth(body);
  return Response.json(healthData);
}