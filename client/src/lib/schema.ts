import { z } from "zod";

export interface Book {
  id?: string;
  isbn: string;
  title: string;
  author: string;
  bookFormat: string;
  description?: string | null;
  imageLink: string;
  rating: number;
  numRatings: number;
  genres: string;
  numBooks: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const insertBookSchema = z.object({
  isbn: z.string(),
  title: z.string(),
  author: z.string(),
  bookFormat: z.string(),
  description: z.string().nullable().optional(),
  imageLink: z.string(),
  rating: z.number(),
  numRatings: z.number(),
  genres: z.string(),
  numBooks: z.number(),
}); 