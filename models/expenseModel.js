// Expense Model - Handles data structure + data access

import prisma from '../lib/prisma';

export async function createExpense(data) {
  return prisma.expense.create({
    data
  });
}

export async function findAllExpenses(filters) {
  const {
    category,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    skip,
    take,
    sortBy,
    order
  } = filters;

  const where = {};

  if (category) {
    where.category = category;
  }

  if (minAmount || maxAmount) {
    where.amount = {};
    if (minAmount) where.amount.gte = minAmount;
    if (maxAmount) where.amount.lte = maxAmount;
  }

  // Date filtering
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Get total count
  const total = await prisma.expense.count({ where });

  // Get paginated data
  const data = await prisma.expense.findMany({
    where,
    skip,
    take,
    orderBy: { [sortBy]: order }
  });

  return {
    total,
    page: Math.floor(skip / take) + 1,
    limit: take,
    data
  };
}