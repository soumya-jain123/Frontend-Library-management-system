import { QueryClient } from "@tanstack/react-query";
import { mockApiHandlers } from "./mockData";

// Mock data handlers
const mockData = {
  books: [],
  users: [],
  borrowings: [],
  notifications: []
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false
    }
  }
});

export const apiRequest = async (method: string, endpoint: string, data?: any) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Use mock handlers
  if (method === "GET" && mockApiHandlers[endpoint]) {
    return {
      ok: true,
      json: async () => mockApiHandlers[endpoint]()
    };
  }

  if (method === "POST" && mockApiHandlers[endpoint]) {
    return {
      ok: true,
      json: async () => mockApiHandlers[endpoint](data)
    };
  }

  throw new Error("API endpoint not found");
};
