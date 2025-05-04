import { User } from "../shared/schema";

// Mock database
export const mockUsers: User[] = [
  {
    id: 1,
    username: "librarian1",
    name: "John Smith",
    email: "librarian1@library.com",
    role: "librarian",
    active: true
  }
];

// Mock API handlers
export const mockApiHandlers = {
  "/api/users/librarian": () => mockUsers.filter(user => user.role === "librarian"),
  "/api/register": (data: any) => {
    const newUser = {
      id: mockUsers.length + 1,
      username: data.username,
      name: data.name,
      email: data.email,
      role: data.role,
      active: true
    };
    mockUsers.push(newUser);
    return newUser;
  }
}; 