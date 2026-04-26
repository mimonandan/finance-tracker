import { createLoan, findAllLoans } from '../models/loanModel';

export async function addLoan(data) {
  const { amount, type } = data;

  if (!amount || amount <= 0) {
    throw new Error("Loan amount must be greater than 0");
  }

  if (!type) {
    throw new Error("Loan type is required");
  }

  return await createLoan(data);
}

export async function getLoans() {
  return await findAllLoans();
}