//services/expenseService.js - Buisness logic for the expense operations can be expanded here in the future if needed.
// Service → handles logic and data manipulation.

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
    order
  } = query;

  // Defaults
  page = page ? parseInt(page) : 1;
  limit = limit ? parseInt(limit) : 10;

  minAmount = minAmount ? parseFloat(minAmount) : undefined;
  maxAmount = maxAmount ? parseFloat(maxAmount) : undefined;

  sortBy = sortBy || "createdAt";
  order = order === "asc" ? "asc" : "desc";

  // VALIDATE sortBy
  const allowedSortFields = ["id", "amount", "category", "createdAt"];
  if (!allowedSortFields.includes(sortBy)) {
    throw new Error("Invalid sort field");
  }

  // Safety
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  const filters = {
    category,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    skip: (page - 1) * limit,
    take: limit,
    sortBy,
    order
  };

  return await findAllExpenses(filters);
}