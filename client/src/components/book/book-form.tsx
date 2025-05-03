import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertBookSchema, Book } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BookFormProps {
  onSubmit: (data: BookFormValues) => void;
  defaultValues?: Partial<Book>;
  isSubmitting?: boolean;
}

// Extend the book schema with client-side validation
const bookFormSchema = insertBookSchema.extend({
  title: z.string().min(2, "Title must be at least 2 characters"),
  author: z.string().min(2, "Author must be at least 2 characters"),
  isbn: z.string().min(10, "ISBN must be at least 10 characters"),
  category: z.string().min(2, "Category is required"),
  publicationYear: z
    .number()
    .int("Must be a year")
    .min(1000, "Invalid year")
    .max(new Date().getFullYear(), "Cannot be a future year")
    .optional()
    .nullable()
    .or(z.string().regex(/^\d+$/).transform(Number).optional()),
  description: z.string().optional(),
  coverImage: z.string().url("Must be a valid URL").optional().nullable(),
  quantity: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must have at least 1 copy")
    .default(1),
  available: z
    .number()
    .int("Must be a whole number")
    .min(0, "Cannot be negative")
    .default(1),
});

export type BookFormValues = z.infer<typeof bookFormSchema>;

const BookForm: React.FC<BookFormProps> = ({
  onSubmit,
  defaultValues,
  isSubmitting = false,
}) => {
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      author: defaultValues?.author || "",
      isbn: defaultValues?.isbn || "",
      category: defaultValues?.category || "",
      publicationYear: defaultValues?.publicationYear || null,
      description: defaultValues?.description || "",
      coverImage: defaultValues?.coverImage || null,
      quantity: defaultValues?.quantity || 1,
      available: defaultValues?.available || 1,
    },
  });

  // Book categories
  const categories = [
    "Fiction",
    "Non-Fiction",
    "Science",
    "Technology",
    "Computer Science",
    "Engineering",
    "Mathematics",
    "Philosophy",
    "Psychology",
    "History",
    "Biography",
    "Self-Help",
    "Business",
    "Economics",
    "Arts",
    "Literature",
    "Reference",
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title*</FormLabel>
                <FormControl>
                  <Input placeholder="Enter book title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author*</FormLabel>
                <FormControl>
                  <Input placeholder="Enter author name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isbn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ISBN*</FormLabel>
                <FormControl>
                  <Input placeholder="Enter ISBN number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="publicationYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Publication Year</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter publication year"
                    {...field}
                    value={field.value === null ? "" : field.value}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? null
                          : parseInt(e.target.value, 10)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="coverImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Image URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter cover image URL"
                    {...field}
                    value={field.value === null ? "" : field.value}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : e.target.value
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity*</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Enter quantity"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="available"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Available*</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Enter available quantity"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter book description"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : defaultValues?.id
              ? "Update Book"
              : "Add Book"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BookForm;
