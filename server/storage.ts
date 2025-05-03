import { users, books, borrowings, bookRequests, holdRequests, bookRatings, notifications } from "@shared/schema";
import type { 
  User, Book, Borrowing, BookRequest, HoldRequest, BookRating, Notification,
  InsertUser, InsertBook, InsertBorrowing, InsertBookRequest, InsertHoldRequest,
  InsertBookRating, InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lt, isNull, desc, like, or } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  toggleUserStatus(id: number): Promise<User | undefined>;
  
  // Book operations
  getBook(id: number): Promise<Book | undefined>;
  getBookByISBN(isbn: string): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  getAllBooks(): Promise<Book[]>;
  updateBook(id: number, book: Partial<Book>): Promise<Book | undefined>;
  deleteBook(id: number): Promise<boolean>;
  searchBooks(query: string): Promise<Book[]>;
  
  // Borrowing operations
  createBorrowing(borrowing: InsertBorrowing): Promise<Borrowing>;
  getBorrowingsByUser(userId: number): Promise<Borrowing[]>;
  getBorrowingsByBook(bookId: number): Promise<Borrowing[]>;
  getActiveBorrowings(): Promise<Borrowing[]>;
  getOverdueBorrowings(): Promise<Borrowing[]>;
  returnBook(id: number, returnDate: Date, fine: number): Promise<Borrowing | undefined>;
  
  // Book request operations
  createBookRequest(request: InsertBookRequest): Promise<BookRequest>;
  getBookRequestsByUser(userId: number): Promise<BookRequest[]>;
  getAllBookRequests(): Promise<BookRequest[]>;
  updateBookRequestStatus(id: number, status: string, approvedBy?: number): Promise<BookRequest | undefined>;
  
  // Hold request operations
  createHoldRequest(request: InsertHoldRequest): Promise<HoldRequest>;
  getHoldRequestsByUser(userId: number): Promise<HoldRequest[]>;
  getHoldRequestsByBook(bookId: number): Promise<HoldRequest[]>;
  updateHoldRequestStatus(id: number, status: string): Promise<HoldRequest | undefined>;
  
  // Book rating operations
  createBookRating(rating: InsertBookRating): Promise<BookRating>;
  getBookRatingsByBook(bookId: number): Promise<BookRating[]>;
  getBookRatingsByUser(userId: number): Promise<BookRating[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // Report operations
  getFineReportByUser(userId: number): Promise<number>;
  getTotalFinesByMonth(month: number, year: number): Promise<number>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async toggleUserStatus(id: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const [updatedUser] = await db.update(users)
      .set({ active: !user.active })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Book operations
  async getBook(id: number): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book;
  }

  async getBookByISBN(isbn: string): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.isbn, isbn));
    return book;
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const [book] = await db.insert(books).values(insertBook).returning();
    return book;
  }

  async getAllBooks(): Promise<Book[]> {
    return await db.select().from(books);
  }

  async updateBook(id: number, bookData: Partial<Book>): Promise<Book | undefined> {
    const [book] = await db.update(books)
      .set(bookData)
      .where(eq(books.id, id))
      .returning();
    return book;
  }

  async deleteBook(id: number): Promise<boolean> {
    const result = await db.delete(books).where(eq(books.id, id));
    return true; // If no error was thrown, the delete was successful
  }

  async searchBooks(query: string): Promise<Book[]> {
    return await db.select().from(books).where(
      or(
        like(books.title, `%${query}%`),
        like(books.author, `%${query}%`),
        like(books.isbn, `%${query}%`),
        like(books.category, `%${query}%`)
      )
    );
  }

  // Borrowing operations
  async createBorrowing(insertBorrowing: InsertBorrowing): Promise<Borrowing> {
    // First get the current book info
    const [book] = await db.select().from(books).where(eq(books.id, insertBorrowing.bookId));
    
    if (book) {
      // Update the book's available count directly without using a function
      await db.update(books)
        .set({ available: book.available - 1 })
        .where(eq(books.id, insertBorrowing.bookId));
    }
    
    const [borrowing] = await db.insert(borrowings)
      .values(insertBorrowing)
      .returning();
    return borrowing;
  }

  async getBorrowingsByUser(userId: number): Promise<Borrowing[]> {
    return await db.select()
      .from(borrowings)
      .where(eq(borrowings.userId, userId))
      .orderBy(desc(borrowings.borrowDate));
  }

  async getBorrowingsByBook(bookId: number): Promise<Borrowing[]> {
    return await db.select()
      .from(borrowings)
      .where(eq(borrowings.bookId, bookId))
      .orderBy(desc(borrowings.borrowDate));
  }

  async getActiveBorrowings(): Promise<Borrowing[]> {
    return await db.select()
      .from(borrowings)
      .where(isNull(borrowings.returnDate))
      .orderBy(desc(borrowings.borrowDate));
  }

  async getOverdueBorrowings(): Promise<Borrowing[]> {
    const now = new Date();
    return await db.select()
      .from(borrowings)
      .where(and(
        isNull(borrowings.returnDate),
        lt(borrowings.dueDate, now)
      ))
      .orderBy(desc(borrowings.borrowDate));
  }

  async returnBook(id: number, returnDate: Date, fine: number): Promise<Borrowing | undefined> {
    // Get the borrowing to update the book's available count
    const [borrowing] = await db.select()
      .from(borrowings)
      .where(eq(borrowings.id, id));
    
    if (!borrowing) return undefined;
    
    // Get the book and update its available count
    const [book] = await db.select().from(books).where(eq(books.id, borrowing.bookId));
    
    if (book) {
      await db.update(books)
        .set({ available: book.available + 1 })
        .where(eq(books.id, borrowing.bookId));
    }
    
    // Update the borrowing record
    const [updatedBorrowing] = await db.update(borrowings)
      .set({
        returnDate: returnDate,
        fine: fine,
        status: 'returned'
      })
      .where(eq(borrowings.id, id))
      .returning();
      
    return updatedBorrowing;
  }

  // Book request operations
  async createBookRequest(insertRequest: InsertBookRequest): Promise<BookRequest> {
    const [request] = await db.insert(bookRequests)
      .values(insertRequest)
      .returning();
    return request;
  }

  async getBookRequestsByUser(userId: number): Promise<BookRequest[]> {
    return await db.select()
      .from(bookRequests)
      .where(eq(bookRequests.userId, userId))
      .orderBy(desc(bookRequests.requestDate));
  }

  async getAllBookRequests(): Promise<BookRequest[]> {
    return await db.select()
      .from(bookRequests)
      .orderBy(desc(bookRequests.requestDate));
  }

  async updateBookRequestStatus(id: number, status: string, approvedBy?: number): Promise<BookRequest | undefined> {
    const updateData: any = { status };
    if (approvedBy !== undefined) {
      updateData.approvedBy = approvedBy;
    }
    
    const [request] = await db.update(bookRequests)
      .set(updateData)
      .where(eq(bookRequests.id, id))
      .returning();
    return request;
  }

  // Hold request operations
  async createHoldRequest(insertRequest: InsertHoldRequest): Promise<HoldRequest> {
    const [request] = await db.insert(holdRequests)
      .values(insertRequest)
      .returning();
    return request;
  }

  async getHoldRequestsByUser(userId: number): Promise<HoldRequest[]> {
    return await db.select()
      .from(holdRequests)
      .where(eq(holdRequests.userId, userId))
      .orderBy(desc(holdRequests.requestDate));
  }

  async getHoldRequestsByBook(bookId: number): Promise<HoldRequest[]> {
    return await db.select()
      .from(holdRequests)
      .where(eq(holdRequests.bookId, bookId))
      .orderBy(desc(holdRequests.requestDate));
  }

  async updateHoldRequestStatus(id: number, status: string): Promise<HoldRequest | undefined> {
    const [request] = await db.update(holdRequests)
      .set({ status })
      .where(eq(holdRequests.id, id))
      .returning();
    return request;
  }

  // Book rating operations
  async createBookRating(insertRating: InsertBookRating): Promise<BookRating> {
    const [rating] = await db.insert(bookRatings)
      .values(insertRating)
      .returning();
    return rating;
  }

  async getBookRatingsByBook(bookId: number): Promise<BookRating[]> {
    return await db.select()
      .from(bookRatings)
      .where(eq(bookRatings.bookId, bookId))
      .orderBy(desc(bookRatings.ratingDate));
  }

  async getBookRatingsByUser(userId: number): Promise<BookRating[]> {
    return await db.select()
      .from(bookRatings)
      .where(eq(bookRatings.userId, userId))
      .orderBy(desc(bookRatings.ratingDate));
  }

  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  // Report operations
  async getFineReportByUser(userId: number): Promise<number> {
    // Use raw SQL query since we're having issues with the ORM approach
    const result = await pool.query(`
      SELECT SUM(fine) as total_fines
      FROM borrowings
      WHERE user_id = $1
    `, [userId]);
    
    return Number(result.rows[0]?.total_fines || 0);
  }

  async getTotalFinesByMonth(month: number, year: number): Promise<number> {
    // This is more complex in SQL, but here's a simplified version
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    
    // Use raw SQL query since we're having issues with the ORM approach
    const result = await pool.query(`
      SELECT SUM(fine) as total_fines
      FROM borrowings
      WHERE return_date >= $1 AND return_date <= $2
    `, [startOfMonth, endOfMonth]);
    
    return Number(result.rows[0]?.total_fines || 0);
  }
}

export const storage = new DatabaseStorage();