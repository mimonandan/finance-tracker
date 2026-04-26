import prisma from '../lib/prisma';

export async function createLoan(data) {
  return prisma.loan.create({
    data
  });
}

export async function findAllLoans() {
  return prisma.loan.findMany({
    orderBy: { createdAt: 'desc' }
  });
}