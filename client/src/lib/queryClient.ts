
import { QueryClient } from "@tanstack/react-query";

// Mock data handlers
const mockData = {
  books: [],
  users: [],
  borrowings: [],
  notifications: []
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock responses based on URL
  if (url.includes('/api/books')) {
    return { json: () => mockData.books };
  }
  if (url.includes('/api/users')) {
    return { json: () => mockData.users };
  }
  if (url.includes('/api/borrowings')) {
    return { json: () => mockData.borrowings };
  }
  if (url.includes('/api/notifications')) {
    return { json: () => mockData.notifications };
  }
  
  return { json: () => ({}) };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
