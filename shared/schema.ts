import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, foreignKey, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', ['admin', 'librarian', 'student']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: userRoleEnum("role").notNull().default('student'),
  active: boolean("active").notNull().default(true),
});

// Books table
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  isbn: text("isbn").notNull().unique(),
  category: text("category").notNull(),
  publicationYear: integer("publication_year"),
  description: text("description"),
  coverImage: text("cover_image"),
  quantity: integer("quantity").notNull().default(1),
  available: integer("available").notNull().default(1),
  addedBy: integer("added_by").notNull().references(() => users.id),
});

// Book borrowing table
export const borrowings = pgTable("borrowings", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => books.id),
  userId: integer("user_id").notNull().references(() => users.id),
  borrowDate: timestamp("borrow_date").notNull().defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  returnDate: timestamp("return_date"),
  fine: integer("fine").default(0),
  status: text("status").notNull().default('borrowed'), // borrowed, returned, overdue
  issuedBy: integer("issued_by").notNull().references(() => users.id),
});

// Book requests table
export const bookRequests = pgTable("book_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  author: text("author"),
  status: text("status").notNull().default('pending'), // pending, approved, rejected
  requestDate: timestamp("request_date").notNull().defaultNow(),
  approvedBy: integer("approved_by").references(() => users.id),
});

// Book hold requests table
export const holdRequests = pgTable("hold_requests", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => books.id),
  userId: integer("user_id").notNull().references(() => users.id),
  requestDate: timestamp("request_date").notNull().defaultNow(),
  expiryDate: timestamp("expiry_date").notNull(),
  status: text("status").notNull().default('pending'), // pending, approved, rejected, expired
});

// Book ratings and reviews
export const bookRatings = pgTable("book_ratings", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => books.id),
  userId: integer("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  review: text("review"),
  ratingDate: timestamp("rating_date").notNull().defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  type: text("type").notNull(), // due_date, fine, approval, etc.
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schemas for insert operations
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertBookSchema = createInsertSchema(books).omit({ id: true });
export const insertBorrowingSchema = createInsertSchema(borrowings).omit({ id: true, borrowDate: true, returnDate: true });
export const insertBookRequestSchema = createInsertSchema(bookRequests).omit({ id: true, requestDate: true, approvedBy: true });
export const insertHoldRequestSchema = createInsertSchema(holdRequests).omit({ id: true, requestDate: true });
export const insertBookRatingSchema = createInsertSchema(bookRatings).omit({ id: true, ratingDate: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

// Types for insert operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type InsertBorrowing = z.infer<typeof insertBorrowingSchema>;
export type InsertBookRequest = z.infer<typeof insertBookRequestSchema>;
export type InsertHoldRequest = z.infer<typeof insertHoldRequestSchema>;
export type InsertBookRating = z.infer<typeof insertBookRatingSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Types for select operations
export type User = typeof users.$inferSelect;
export type Book = typeof books.$inferSelect;
export type Borrowing = typeof borrowings.$inferSelect;
export type BookRequest = typeof bookRequests.$inferSelect;
export type HoldRequest = typeof holdRequests.$inferSelect;
export type BookRating = typeof bookRatings.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["admin", "librarian", "student"]),
});

export type LoginData = z.infer<typeof loginSchema>;

// Define relations between tables
export const userRelations = relations(users, ({ many }) => ({
  books: many(books),
  borrowings: many(borrowings, { relationName: "borrower" }),
  issuedBorrowings: many(borrowings, { relationName: "issuer" }),
  bookRequests: many(bookRequests),
  holdRequests: many(holdRequests),
  bookRatings: many(bookRatings),
  notifications: many(notifications),
}));

export const bookRelations = relations(books, ({ one, many }) => ({
  addedBy: one(users, {
    fields: [books.addedBy],
    references: [users.id],
  }),
  borrowings: many(borrowings),
  holdRequests: many(holdRequests),
  bookRatings: many(bookRatings),
}));

export const borrowingRelations = relations(borrowings, ({ one }) => ({
  book: one(books, {
    fields: [borrowings.bookId],
    references: [books.id],
  }),
  borrower: one(users, {
    fields: [borrowings.userId],
    references: [users.id],
    relationName: "borrower",
  }),
  issuer: one(users, {
    fields: [borrowings.issuedBy],
    references: [users.id],
    relationName: "issuer",
  }),
}));

export const bookRequestRelations = relations(bookRequests, ({ one }) => ({
  user: one(users, {
    fields: [bookRequests.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [bookRequests.approvedBy],
    references: [users.id],
  }),
}));

export const holdRequestRelations = relations(holdRequests, ({ one }) => ({
  book: one(books, {
    fields: [holdRequests.bookId],
    references: [books.id],
  }),
  user: one(users, {
    fields: [holdRequests.userId],
    references: [users.id],
  }),
}));

export const bookRatingRelations = relations(bookRatings, ({ one }) => ({
  book: one(books, {
    fields: [bookRatings.bookId],
    references: [books.id],
  }),
  user: one(users, {
    fields: [bookRatings.userId],
    references: [users.id],
  }),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
