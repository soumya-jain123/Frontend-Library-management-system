import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertBookSchema, insertBookRequestSchema, insertHoldRequestSchema, insertBookRatingSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Books API
  app.get("/api/books", async (req, res) => {
    const books = await storage.getAllBooks();
    res.json(books);
  });

  app.get("/api/books/search", async (req, res) => {
    const query = req.query.q as string || "";
    const books = await storage.searchBooks(query);
    res.json(books);
  });

  app.get("/api/books/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }
    
    const book = await storage.getBook(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    
    res.json(book);
  });

  app.post("/api/books", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'librarian')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const bookData = insertBookSchema.parse({
        ...req.body,
        addedBy: req.user.id
      });
      
      const existingBook = await storage.getBookByISBN(bookData.isbn);
      if (existingBook) {
        return res.status(400).json({ message: "Book with this ISBN already exists" });
      }
      
      const book = await storage.createBook(bookData);
      res.status(201).json(book);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid book data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create book" });
    }
  });

  app.put("/api/books/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'librarian')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }
    
    const book = await storage.getBook(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    
    try {
      const updatedBook = await storage.updateBook(id, req.body);
      res.json(updatedBook);
    } catch (error) {
      res.status(500).json({ message: "Failed to update book" });
    }
  });

  app.delete("/api/books/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'librarian')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }
    
    const deleted = await storage.deleteBook(id);
    if (!deleted) {
      return res.status(404).json({ message: "Book not found" });
    }
    
    res.status(204).end();
  });

  // Borrowing API
  app.post("/api/borrowings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { bookId, userId, dueDate } = req.body;
    
    if (!bookId || !userId || !dueDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Check if the book exists and is available
    const book = await storage.getBook(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    
    if (book.available <= 0) {
      return res.status(400).json({ message: "Book is not available for borrowing" });
    }
    
    // For librarians, check if the user exists
    if (req.user.role === 'librarian' || req.user.role === 'admin') {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.active) {
        return res.status(400).json({ message: "User account is inactive" });
      }
    } else if (req.user.role === 'student') {
      // Students can only borrow for themselves
      if (req.user.id !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
    }
    
    try {
      const borrowing = await storage.createBorrowing({
        bookId,
        userId,
        dueDate: new Date(dueDate),
        issuedBy: req.user.role === 'student' ? userId : req.user.id,
        status: 'borrowed',
        fine: 0
      });
      
      // Create notification for the user
      await storage.createNotification({
        userId,
        message: `You have borrowed "${book.title}" until ${new Date(dueDate).toLocaleDateString()}`,
        type: 'borrow',
        read: false
      });
      
      res.status(201).json(borrowing);
    } catch (error) {
      res.status(500).json({ message: "Failed to create borrowing" });
    }
  });

  app.get("/api/borrowings/user/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Students can only see their own borrowings
    if (req.user.role === 'student' && req.user.id !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const borrowings = await storage.getBorrowingsByUser(userId);
    
    // Fetch book details for each borrowing
    const borrowingsWithDetails = await Promise.all(borrowings.map(async (borrowing) => {
      const book = await storage.getBook(borrowing.bookId);
      return {
        ...borrowing,
        book
      };
    }));
    
    res.json(borrowingsWithDetails);
  });

  app.get("/api/borrowings/active", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'librarian')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const borrowings = await storage.getActiveBorrowings();
    
    // Fetch book and user details
    const borrowingsWithDetails = await Promise.all(borrowings.map(async (borrowing) => {
      const book = await storage.getBook(borrowing.bookId);
      const user = await storage.getUser(borrowing.userId);
      return {
        ...borrowing,
        book,
        user
      };
    }));
    
    res.json(borrowingsWithDetails);
  });

  app.get("/api/borrowings/overdue", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'librarian')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const borrowings = await storage.getOverdueBorrowings();
    
    // Fetch book and user details
    const borrowingsWithDetails = await Promise.all(borrowings.map(async (borrowing) => {
      const book = await storage.getBook(borrowing.bookId);
      const user = await storage.getUser(borrowing.userId);
      return {
        ...borrowing,
        book,
        user
      };
    }));
    
    res.json(borrowingsWithDetails);
  });

  app.post("/api/borrowings/:id/return", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid borrowing ID" });
    }
    
    const { fine } = req.body;
    
    if (fine === undefined) {
      return res.status(400).json({ message: "Fine amount is required" });
    }
    
    const borrowing = await storage.borrowings.get(id);
    if (!borrowing) {
      return res.status(404).json({ message: "Borrowing record not found" });
    }
    
    // Students can only return their own books
    if (req.user.role === 'student' && req.user.id !== borrowing.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const returnDate = new Date();
      const updatedBorrowing = await storage.returnBook(id, returnDate, fine);
      
      if (!updatedBorrowing) {
        return res.status(404).json({ message: "Borrowing record not found" });
      }
      
      // Get book details
      const book = await storage.getBook(borrowing.bookId);
      
      // Create notification for the user
      await storage.createNotification({
        userId: borrowing.userId,
        message: `You have returned "${book?.title}"${fine > 0 ? ` with a fine of $${fine}` : ''}`,
        type: 'return',
        read: false
      });
      
      res.json(updatedBorrowing);
    } catch (error) {
      res.status(500).json({ message: "Failed to return book" });
    }
  });

  // User management API (for admin)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.get("/api/users/:role", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const { role } = req.params;
    if (!['admin', 'librarian', 'student'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    const users = await storage.getUsersByRole(role);
    res.json(users);
  });

  app.put("/api/users/:id/toggle-status", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Admin can't deactivate themselves
    if (id === req.user.id) {
      return res.status(400).json({ message: "Cannot deactivate your own account" });
    }
    
    const user = await storage.toggleUserStatus(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  });

  // Book requests
  app.post("/api/book-requests", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const requestData = insertBookRequestSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const request = await storage.createBookRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create book request" });
    }
  });

  app.get("/api/book-requests", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'librarian')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const requests = await storage.getAllBookRequests();
    
    // Fetch user details
    const requestsWithDetails = await Promise.all(requests.map(async (request) => {
      const user = await storage.getUser(request.userId);
      return {
        ...request,
        user
      };
    }));
    
    res.json(requestsWithDetails);
  });

  app.get("/api/book-requests/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const requests = await storage.getBookRequestsByUser(req.user.id);
    res.json(requests);
  });

  app.put("/api/book-requests/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'librarian')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }
    
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const request = await storage.updateBookRequestStatus(id, status, req.user.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    
    // Create notification for the user
    await storage.createNotification({
      userId: request.userId,
      message: `Your book request for "${request.title}" has been ${status}`,
      type: 'request_update',
      read: false
    });
    
    res.json(request);
  });

  // Hold requests
  app.post("/api/hold-requests", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Calculate expiry date (1 week from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      
      const requestData = insertHoldRequestSchema.parse({
        ...req.body,
        userId: req.user.id,
        expiryDate
      });
      
      // Check if the book exists
      const book = await storage.getBook(requestData.bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      const request = await storage.createHoldRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create hold request" });
    }
  });

  app.get("/api/hold-requests/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const requests = await storage.getHoldRequestsByUser(req.user.id);
    
    // Fetch book details
    const requestsWithDetails = await Promise.all(requests.map(async (request) => {
      const book = await storage.getBook(request.bookId);
      return {
        ...request,
        book
      };
    }));
    
    res.json(requestsWithDetails);
  });

  app.get("/api/hold-requests/book/:bookId", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'librarian')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const bookId = parseInt(req.params.bookId);
    if (isNaN(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }
    
    const requests = await storage.getHoldRequestsByBook(bookId);
    
    // Fetch user details
    const requestsWithDetails = await Promise.all(requests.map(async (request) => {
      const user = await storage.getUser(request.userId);
      return {
        ...request,
        user
      };
    }));
    
    res.json(requestsWithDetails);
  });

  app.put("/api/hold-requests/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'librarian')) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }
    
    const { status } = req.body;
    if (!['approved', 'rejected', 'expired'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const request = await storage.updateHoldRequestStatus(id, status);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    
    // Get book details
    const book = await storage.getBook(request.bookId);
    
    // Create notification for the user
    await storage.createNotification({
      userId: request.userId,
      message: `Your hold request for "${book?.title}" has been ${status}`,
      type: 'hold_update',
      read: false
    });
    
    res.json(request);
  });

  // Book ratings
  app.post("/api/book-ratings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const ratingData = insertBookRatingSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Check if the book exists
      const book = await storage.getBook(ratingData.bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      // Check if user has already rated this book
      const existingRatings = await storage.getBookRatingsByUser(req.user.id);
      const hasRated = existingRatings.some(r => r.bookId === ratingData.bookId);
      
      if (hasRated) {
        return res.status(400).json({ message: "You have already rated this book" });
      }
      
      const rating = await storage.createBookRating(ratingData);
      res.status(201).json(rating);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rating data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create rating" });
    }
  });

  app.get("/api/book-ratings/:bookId", async (req, res) => {
    const bookId = parseInt(req.params.bookId);
    if (isNaN(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }
    
    const ratings = await storage.getBookRatingsByBook(bookId);
    
    // Calculate average rating
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings
      : 0;
    
    res.json({
      ratings,
      averageRating,
      totalRatings
    });
  });

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const notifications = await storage.getNotificationsByUser(req.user.id);
    res.json(notifications);
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }
    
    const notification = await storage.markNotificationAsRead(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.json(notification);
  });

  // Reports
  app.get("/api/reports/fines/user/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Students can only see their own fine reports
    if (req.user.role === 'student' && req.user.id !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const totalFines = await storage.getFineReportByUser(userId);
    res.json({ userId, totalFines });
  });

  app.get("/api/reports/fines/month/:month/:year", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const month = parseInt(req.params.month);
    const year = parseInt(req.params.year);
    
    if (isNaN(month) || month < 0 || month > 11 || isNaN(year)) {
      return res.status(400).json({ message: "Invalid month or year" });
    }
    
    const totalFines = await storage.getTotalFinesByMonth(month, year);
    res.json({ month, year, totalFines });
  });

  const httpServer = createServer(app);
  return httpServer;
}
