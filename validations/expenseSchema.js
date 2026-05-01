import { z } from "zod";

// CREATE SCHEMA
export const createExpenseSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0"),

  category: z
    .string()
    .min(1, "Category is required")
    .regex(/^[a-zA-Z\s]+$/, "Category must contain only letters"),

    userId: z.number()
});


// UPDATE SCHEMA
export const updateExpenseSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .optional(),

  category: z
    .string()
    .regex(/^[a-zA-Z\s]+$/, "Category must contain only letters")
    .optional()
}).refine(
  (data) => data.amount !== undefined || data.category !== undefined,
  {
    message: "At least one field (amount or category) is required"
  }
);