import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Book {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  category?: string;
  quantity?: number;
  available?: number;
  dueDate?: Date;
  borrower?: string;
  isOverdue?: boolean;
  status?: string;
}

interface BookTableProps {
  books: Book[];
  type: "all" | "borrowed" | "overdue" | "returned";
  onRenew?: (id: number) => void;
  onReturn?: (id: number) => void;
  onEdit?: (book: Book) => void;
  onDelete?: (id: number) => void;
  isLoading?: boolean;
}

const BookTable: React.FC<BookTableProps> = ({
  books,
  type,
  onRenew,
  onReturn,
  onEdit,
  onDelete,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Book>("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const itemsPerPage = 10;

  // Filter books based on search term
  const filteredBooks = books.filter((book) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      book.title.toLowerCase().includes(searchLower) ||
      book.author.toLowerCase().includes(searchLower) ||
      (book.isbn && book.isbn.toLowerCase().includes(searchLower)) ||
      (book.category && book.category.toLowerCase().includes(searchLower)) ||
      (book.borrower && book.borrower.toLowerCase().includes(searchLower))
    );
  });

  // Sort books based on sort field and direction
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === undefined || bValue === undefined) return 0;

    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === "asc"
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  // Paginate books
  const totalPages = Math.ceil(sortedBooks.length / itemsPerPage);
  const paginatedBooks = sortedBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle sort
  const handleSort = (field: keyof Book) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Generate column headers based on type
  const getColumnHeaders = () => {
    const commonColumns = [
      {
        field: "title" as keyof Book,
        label: "Title/Author",
        sortable: true,
      },
    ];

    if (type === "all") {
      return [
        ...commonColumns,
        {
          field: "category" as keyof Book,
          label: "Category",
          sortable: true,
        },
        {
          field: "available" as keyof Book,
          label: "Availability",
          sortable: true,
        },
        {
          field: "actions" as keyof Book,
          label: "Actions",
          sortable: false,
        },
      ];
    } else if (type === "borrowed" || type === "overdue") {
      return [
        ...commonColumns,
        {
          field: "borrower" as keyof Book,
          label: "Borrower",
          sortable: true,
        },
        {
          field: "dueDate" as keyof Book,
          label: "Due Date",
          sortable: true,
        },
        {
          field: "actions" as keyof Book,
          label: "Actions",
          sortable: false,
        },
      ];
    } else if (type === "returned") {
      return [
        ...commonColumns,
        {
          field: "borrower" as keyof Book,
          label: "Borrower",
          sortable: true,
        },
        {
          field: "status" as keyof Book,
          label: "Status",
          sortable: true,
        },
      ];
    }

    return commonColumns;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search books..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on new search
            }}
          />
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {filteredBooks.length} {filteredBooks.length === 1 ? "book" : "books"}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {getColumnHeaders().map((column, index) => (
                <TableHead key={index} className="whitespace-nowrap">
                  {column.sortable ? (
                    <button
                      className="flex items-center gap-1"
                      onClick={() => handleSort(column.field)}
                    >
                      {column.label}
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={getColumnHeaders().length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <BookOpen className="h-8 w-8 animate-pulse text-primary/70" />
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Loading books...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedBooks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={getColumnHeaders().length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      No books found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedBooks.map((book) => (
                <TableRow key={book.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <div className="font-medium">{book.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {book.author}
                          {book.isbn && (
                            <span className="ml-2">ISBN: {book.isbn}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Additional columns based on table type */}
                  {type === "all" && (
                    <>
                      <TableCell>{book.category}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            book.available === 0
                              ? "destructive"
                              : book.available === book.quantity
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {book.available} of {book.quantity} available
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {onEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEdit(book)}
                            >
                              Edit
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => onDelete(book.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </>
                  )}

                  {(type === "borrowed" || type === "overdue") && (
                    <>
                      <TableCell>{book.borrower}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {book.dueDate?.toLocaleDateString()}
                          {book.isOverdue && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {onRenew && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onRenew(book.id)}
                            >
                              Renew
                            </Button>
                          )}
                          {onReturn && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onReturn(book.id)}
                            >
                              Return
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </>
                  )}

                  {type === "returned" && (
                    <>
                      <TableCell>{book.borrower}</TableCell>
                      <TableCell>
                        {book.status === "returned" ? (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Returned
                          </div>
                        ) : (
                          <div className="flex items-center text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            {book.status}
                          </div>
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredBooks.length > itemsPerPage && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookTable;
