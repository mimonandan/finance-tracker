import { verifyToken } from '@/lib/authMiddleware';
import prisma from '@/lib/prisma';

// 🔹 UPDATE
export async function PATCH(request, context) {
  try {
    const user = verifyToken(request);

    const params = await context.params; // ✅ REQUIRED
    const expenseId = parseInt(params.id);

    if (!expenseId || isNaN(expenseId)) {
      throw new Error("Invalid expense id");
    }

    const body = await request.json();

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

    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(body.amount !== undefined && { amount: body.amount }),
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


// 🔹 DELETE
export async function DELETE(request, context) {
  try {
    const user = verifyToken(request);

    const params = await context.params; // ✅ REQUIRED
    const expenseId = parseInt(params.id);
    
    //console.log("Params:", params);
    
    if (!expenseId || isNaN(expenseId)) {
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