import prisma from '../lib/prisma';

export async function createExpense(data) {
  return prisma.expense.create({ data });
}

export async function findAllExpenses(filters) {
  const {
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
  } = filters;

  const allowedSortFields = ["id", "amount", "category", "createdAt"];

  const safeSortBy = allowedSortFields.includes(sortBy)
    ? sortBy
    : "createdAt";

  const safeOrder = order === "asc" ? "asc" : "desc";

  const where = {
    ...(userId && { userId }),
    ...(category && { category }),
    ...(minAmount || maxAmount
      ? {
          amount: {
            ...(minAmount && { gte: minAmount }),
            ...(maxAmount && { lte: maxAmount })
          }
        }
      : {}),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) })
          }
        }
      : {})
  };

  const total = await prisma.expense.count({ where });

  const data = await prisma.expense.findMany({
    where,
    skip: Number.isNaN(skip) ? 0 : skip,
    take: Number.isNaN(take) ? 10 : take,
    orderBy: { [safeSortBy]: safeOrder }
  });

  return {
    total,
    data
  };
}