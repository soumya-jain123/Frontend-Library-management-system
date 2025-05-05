// Type definitions for the application

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "librarian" | "User";
  active: boolean;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  publishedYear: number;
  available: boolean;
  coverImage?: string;
}

export interface Borrowing {
  id: string;
  userId: string;
  bookId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  fine?: number;
  status: "active" | "returned" | "overdue";
}

export interface BookRequest {
  id: string;
  userId: string;
  bookTitle: string;
  bookAuthor: string;
  requestDate: string;
  status: "pending" | "approved" | "rejected";
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: "info" | "warning" | "success" | "error";
} 