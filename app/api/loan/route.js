import { addLoan, getLoans } from '@/services/loanService';

export async function GET() {
  try {
    const data = await getLoans();

    return Response.json({
      success: true,
      data,
      error: null
    });

  } catch (error) {
    return Response.json(
      { success: false, data: null, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await addLoan(body);

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