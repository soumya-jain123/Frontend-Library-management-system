import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertBookSchema, Book } from "@/lib/schema";
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

// Use the new insertBookSchema directly for validation
export type BookFormValues = z.infer<typeof insertBookSchema>;

const BookForm: React.FC<BookFormProps> = ({
  onSubmit,
  defaultValues,
  isSubmitting = false,
}) => {
  const form = useForm<BookFormValues>({
    resolver: zodResolver(insertBookSchema),
    defaultValues: {
      isbn: defaultValues?.isbn || "",
      title: defaultValues?.title || "",
      author: defaultValues?.author || "",
      bookFormat: defaultValues?.bookFormat || "",
      description: defaultValues?.description || "",
      imageLink: defaultValues?.imageLink || "",
      rating: defaultValues?.rating || 0,
      numRatings: defaultValues?.numRatings || 0,
      genres: defaultValues?.genres || "",
      numBooks: defaultValues?.numBooks || 1,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            name="bookFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Book Format*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Hardcover, Paperback, eBook" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="imageLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Image URL*</FormLabel>
                <FormControl>
                  <Input placeholder="Enter cover image URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating*</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    max={5}
                    placeholder="Enter rating (e.g. 4.5)"
                    {...field}
                    value={field.value}
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numRatings"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Ratings*</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Enter number of ratings"
                    {...field}
                    value={field.value}
                    onChange={e => field.onChange(parseInt(e.target.value, 10))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="genres"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Genres*</FormLabel>
                <FormControl>
                  <Input placeholder="Enter genres (comma separated)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numBooks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Books*</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Enter number of books"
                    {...field}
                    value={field.value}
                    onChange={e => field.onChange(parseInt(e.target.value, 10))}
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
                <Textarea placeholder="Enter book description" rows={4} {...field} />
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
