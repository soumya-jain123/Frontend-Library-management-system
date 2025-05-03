import { users, books, borrowings, bookRequests, holdRequests, bookRatings, notifications } from "@shared/schema";
import type { 
  User, Book, Borrowing, BookRequest, HoldRequest, BookRating, Notification,
  InsertUser, InsertBook, InsertBorrowing, InsertBookRequest, InsertHoldRequest, 
  InsertBookRating, InsertNotification 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private books: Map<number, Book>;
  private borrowings: Map<number, Borrowing>;
  private bookRequests: Map<number, BookRequest>;
  private holdRequests: Map<number, HoldRequest>;
  private bookRatings: Map<number, BookRating>;
  private notifications: Map<number, Notification>;
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private bookIdCounter: number;
  private borrowingIdCounter: number;
  private bookRequestIdCounter: number;
  private holdRequestIdCounter: number;
  private bookRatingIdCounter: number;
  private notificationIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.books = new Map();
    this.borrowings = new Map();
    this.bookRequests = new Map();
    this.holdRequests = new Map();
    this.bookRatings = new Map();
    this.notifications = new Map();
    
    this.userIdCounter = 1;
    this.bookIdCounter = 1;
    this.borrowingIdCounter = 1;
    this.bookRequestIdCounter = 1;
    this.holdRequestIdCounter = 1;
    this.bookRatingIdCounter = 1;
    this.notificationIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Initialize with sample admin user
    this.createUser({
      username: "admin",
      password: "admin123", // Will be hashed in auth.ts
      name: "Admin User",
      email: "admin@library.com",
      role: "admin",
      active: true
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === role
    );
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async toggleUserStatus(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    user.active = !user.active;
    this.users.set(id, user);
    return user;
  }
  
  // Book operations
  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }
  
  async getBookByISBN(isbn: string): Promise<Book | undefined> {
    return Array.from(this.books.values()).find(
      (book) => book.isbn === isbn
    );
  }
  
  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = this.bookIdCounter++;
    const book: Book = { ...insertBook, id };
    this.books.set(id, book);
    return book;
  }
  
  async getAllBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }
  
  async updateBook(id: number, bookData: Partial<Book>): Promise<Book | undefined> {
    const book = this.books.get(id);
    if (!book) return undefined;
    
    const updatedBook = { ...book, ...bookData };
    this.books.set(id, updatedBook);
    return updatedBook;
  }
  
  async deleteBook(id: number): Promise<boolean> {
    return this.books.delete(id);
  }
  
  async searchBooks(query: string): Promise<Book[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.books.values()).filter(
      (book) => 
        book.title.toLowerCase().includes(lowercaseQuery) ||
        book.author.toLowerCase().includes(lowercaseQuery) ||
        book.isbn.toLowerCase().includes(lowercaseQuery) ||
        book.category.toLowerCase().includes(lowercaseQuery)
    );
  }
  
  // Borrowing operations
  async createBorrowing(insertBorrowing: InsertBorrowing): Promise<Borrowing> {
    const id = this.borrowingIdCounter++;
    const borrowing: Borrowing = { 
      ...insertBorrowing, 
      id, 
      borrowDate: new Date(),
      returnDate: null 
    };
    this.borrowings.set(id, borrowing);
    
    // Update book availability
    const book = this.books.get(borrowing.bookId);
    if (book && book.available > 0) {
      book.available -= 1;
      this.books.set(book.id, book);
    }
    
    return borrowing;
  }
  
  async getBorrowingsByUser(userId: number): Promise<Borrowing[]> {
    return Array.from(this.borrowings.values()).filter(
      (borrowing) => borrowing.userId === userId
    );
  }
  
  async getBorrowingsByBook(bookId: number): Promise<Borrowing[]> {
    return Array.from(this.borrowings.values()).filter(
      (borrowing) => borrowing.bookId === bookId
    );
  }
  
  async getActiveBorrowings(): Promise<Borrowing[]> {
    return Array.from(this.borrowings.values()).filter(
      (borrowing) => borrowing.returnDate === null
    );
  }
  
  async getOverdueBorrowings(): Promise<Borrowing[]> {
    const now = new Date();
    return Array.from(this.borrowings.values()).filter(
      (borrowing) => 
        borrowing.returnDate === null && 
        new Date(borrowing.dueDate) < now
    );
  }
  
  async returnBook(id: number, returnDate: Date, fine: number): Promise<Borrowing | undefined> {
    const borrowing = this.borrowings.get(id);
    if (!borrowing) return undefined;
    
    borrowing.returnDate = returnDate;
    borrowing.fine = fine;
    borrowing.status = 'returned';
    this.borrowings.set(id, borrowing);
    
    // Update book availability
    const book = this.books.get(borrowing.bookId);
    if (book) {
      book.available += 1;
      this.books.set(book.id, book);
    }
    
    return borrowing;
  }
  
  // Book request operations
  async createBookRequest(insertRequest: InsertBookRequest): Promise<BookRequest> {
    const id = this.bookRequestIdCounter++;
    const request: BookRequest = { 
      ...insertRequest, 
      id, 
      requestDate: new Date(),
      approvedBy: null 
    };
    this.bookRequests.set(id, request);
    return request;
  }
  
  async getBookRequestsByUser(userId: number): Promise<BookRequest[]> {
    return Array.from(this.bookRequests.values()).filter(
      (request) => request.userId === userId
    );
  }
  
  async getAllBookRequests(): Promise<BookRequest[]> {
    return Array.from(this.bookRequests.values());
  }
  
  async updateBookRequestStatus(id: number, status: string, approvedBy?: number): Promise<BookRequest | undefined> {
    const request = this.bookRequests.get(id);
    if (!request) return undefined;
    
    request.status = status;
    if (approvedBy) {
      request.approvedBy = approvedBy;
    }
    this.bookRequests.set(id, request);
    return request;
  }
  
  // Hold request operations
  async createHoldRequest(insertRequest: InsertHoldRequest): Promise<HoldRequest> {
    const id = this.holdRequestIdCounter++;
    const request: HoldRequest = { 
      ...insertRequest, 
      id, 
      requestDate: new Date()
    };
    this.holdRequests.set(id, request);
    return request;
  }
  
  async getHoldRequestsByUser(userId: number): Promise<HoldRequest[]> {
    return Array.from(this.holdRequests.values()).filter(
      (request) => request.userId === userId
    );
  }
  
  async getHoldRequestsByBook(bookId: number): Promise<HoldRequest[]> {
    return Array.from(this.holdRequests.values()).filter(
      (request) => request.bookId === bookId
    );
  }
  
  async updateHoldRequestStatus(id: number, status: string): Promise<HoldRequest | undefined> {
    const request = this.holdRequests.get(id);
    if (!request) return undefined;
    
    request.status = status;
    this.holdRequests.set(id, request);
    return request;
  }
  
  // Book rating operations
  async createBookRating(insertRating: InsertBookRating): Promise<BookRating> {
    const id = this.bookRatingIdCounter++;
    const rating: BookRating = { 
      ...insertRating, 
      id, 
      ratingDate: new Date()
    };
    this.bookRatings.set(id, rating);
    return rating;
  }
  
  async getBookRatingsByBook(bookId: number): Promise<BookRating[]> {
    return Array.from(this.bookRatings.values()).filter(
      (rating) => rating.bookId === bookId
    );
  }
  
  async getBookRatingsByUser(userId: number): Promise<BookRating[]> {
    return Array.from(this.bookRatings.values()).filter(
      (rating) => rating.userId === userId
    );
  }
  
  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      createdAt: new Date()
    };
    this.notifications.set(id, notification);
    return notification;
  }
  
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    notification.read = true;
    this.notifications.set(id, notification);
    return notification;
  }
  
  // Report operations
  async getFineReportByUser(userId: number): Promise<number> {
    return Array.from(this.borrowings.values())
      .filter((borrowing) => borrowing.userId === userId)
      .reduce((total, borrowing) => total + (borrowing.fine || 0), 0);
  }
  
  async getTotalFinesByMonth(month: number, year: number): Promise<number> {
    return Array.from(this.borrowings.values())
      .filter((borrowing) => {
        if (!borrowing.returnDate) return false;
        const returnDate = new Date(borrowing.returnDate);
        return returnDate.getMonth() === month && returnDate.getFullYear() === year;
      })
      .reduce((total, borrowing) => total + (borrowing.fine || 0), 0);
  }
}

export const storage = new MemStorage();
