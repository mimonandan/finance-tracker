import { createExpense, findAllExpenses } from '@/models/expenseModel';
import { createExpenseSchema, updateExpenseSchema } from '@/validations/expenseSchema';

// CREATE EXPENSE
export async function addExpense(data) {
  const parsed = createExpenseSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message); // ✅ FIXED
  }

  return await createExpense(parsed.data);
}


// UPDATE VALIDATION
export function validateUpdateExpense(data) {
  const parsed = updateExpenseSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message); // ✅ FIXED
  }

  return parsed.data;
}


// GET EXPENSES
export async function getExpenses(query) {
  let {
    category,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    page,
    limit,
    sortBy,
    order,
    userId
  } = query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  if (page < 1) page = 1;
  if (limit < 1) limit = 10;

  const skip = (page - 1) * limit;
  const take = limit;

  sortBy = sortBy || "createdAt";
  order = order === "asc" ? "asc" : "desc";

  minAmount = minAmount ? parseFloat(minAmount) : undefined;
  maxAmount = maxAmount ? parseFloat(maxAmount) : undefined;

  const filters = {
    userId,
    category,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    skip,
    take,
    sortBy,
    order
  };

  const result = await findAllExpenses(filters);

  const totalPages = Math.ceil(result.total / limit);

  return {
    items: result.data,
    pagination: {
      total: result.total,
      page,
      limit,
      totalPages
    }
  };
}