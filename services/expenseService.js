//services/expenseService.js - Buisness logic for the expense operations can be expanded here in the future if needed.
// Service → handles logic and data manipulation.

let expenses = [];

export function addExpense(data) {
  const { amount, category } = data;

  // Validation
  if (!amount || amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  if (!category) {
    throw new Error("Category is required");
  }

  const newExpense = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    ...data
  };

  expenses.push(newExpense);
  return newExpense;
}

export function getExpenses() {
  return expenses;
}