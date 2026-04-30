import { createExpense, findAllExpenses } from '@/models/expenseModel';

export async function addExpense(data) {
  const { amount, category } = data;

  if (!amount || amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  if (!category) {
    throw new Error("Category is required");
  }

  return await createExpense(data);
}

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