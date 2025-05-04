import { z } from "zod";

export interface Book {
  id?: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  publicationYear?: number | null;
  description?: string;
  coverImage?: string | null;
  quantity: number;
  available: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const insertBookSchema = z.object({
  title: z.string(),
  author: z.string(),
  isbn: z.string(),
  category: z.string(),
  publicationYear: z.number().nullable().optional(),
  description: z.string().optional(),
  coverImage: z.string().nullable().optional(),
  quantity: z.number().int().min(1),
  available: z.number().int().min(0)
}); 