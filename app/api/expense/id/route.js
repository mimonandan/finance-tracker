import { verifyToken } from '@/lib/authMiddleware';
import prisma from '@/lib/prisma';

// UPDATE EXPENSE (PATCH)
export async function PATCH(request, { params }) {
  try {
    const user = verifyToken(request);

    const expenseId = parseInt(params.id);
    const body = await request.json();

    // Step 1 — Check if expense exists
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId }
    });

    if (!expense) {
      return Response.json(
        { success: false, data: null, error: "Expense not found" },
        { status: 404 }
      );
    }

    // Step 2 — RBAC CHECK
    if (user.role !== "ADMIN" && expense.userId !== user.userId) {
      return Response.json(
        { success: false, data: null, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Step 3 — Update expense
    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(body.amount && { amount: body.amount }),
        ...(body.category && { category: body.category })
    }
    });

    return Response.json({
      success: true,
      data: updatedExpense,
      error: null
    });

  } catch (error) {
    return Response.json(
      { success: false, data: null, error: error.message },
      { status: 400 }
    );
  }
}


// DELETE EXPENSE
export async function DELETE(request, { params }) {
  try {
    const user = verifyToken(request);

    const expenseId = parseInt(params.id);

    // Step 1 — Check if expense exists
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId }
    });

    if (!expense) {
      return Response.json(
        { success: false, data: null, error: "Expense not found" },
        { status: 404 }
      );
    }

    // Step 2 — RBAC CHECK
    if (user.role !== "ADMIN" && expense.userId !== user.userId) {
      return Response.json(
        { success: false, data: null, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Step 3 — Delete expense
    await prisma.expense.delete({
      where: { id: expenseId }
    });

    return Response.json({
      success: true,
      data: "Expense deleted successfully",
      error: null
    });

  } catch (error) {
    return Response.json(
      { success: false, data: null, error: error.message },
      { status: 400 }
    );
  }
}