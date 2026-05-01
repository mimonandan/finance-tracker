import { verifyToken } from '@/lib/authMiddleware';
import prisma from '@/lib/prisma';
import { validateUpdateExpense } from '@/services/expenseService';


// 🔹 UPDATE
export async function PATCH(request, context) {
  try {
    const user = verifyToken(request);

    const params = await context.params; // ✅ REQUIRED
    const expenseId = parseInt(params.id);

    if (isNaN(expenseId)) {
      throw new Error("Invalid expense id");
    }

    const body = await request.json();

    // 🔥 VALIDATION
    const validatedData = validateUpdateExpense(body);

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId }
    });

    if (!expense) {
      return Response.json(
        { success: false, data: null, error: "Expense not found" },
        { status: 404 }
      );
    }

    // 🔥 RBAC
    if (user.role !== "ADMIN" && expense.userId !== user.userId) {
      return Response.json(
        { success: false, data: null, error: "Forbidden" },
        { status: 403 }
      );
    }

    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: validatedData
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


// 🔹 DELETE (UNCHANGED)
export async function DELETE(request, context) {
  try {
    const user = verifyToken(request);

    const params = await context.params;
    const expenseId = parseInt(params.id);

    if (isNaN(expenseId)) {
      throw new Error("Invalid expense id");
    }

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId }
    });

    if (!expense) {
      return Response.json(
        { success: false, data: null, error: "Expense not found" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN" && expense.userId !== user.userId) {
      return Response.json(
        { success: false, data: null, error: "Forbidden" },
        { status: 403 }
      );
    }

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