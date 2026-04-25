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

export async function getExpenses() {
  return await findAllExpenses();
}