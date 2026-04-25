// Expense Model - Handles data structure + data access

import prisma from '../lib/prisma';

export async function createExpense(data) {
  return prisma.expense.create({
    data
  });
}

export async function findAllExpenses() {
  return prisma.expense.findMany();
}