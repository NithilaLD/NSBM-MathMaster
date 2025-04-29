import { apiRequest } from "./queryClient";
import { LoginCredentials, User } from "@shared/schema";

/**
 * Authenticate a user with the provided credentials
 * @param credentials User login credentials
 * @returns User object if successful
 * @throws Error if authentication fails
 */
export async function authenticate(credentials: LoginCredentials): Promise<User> {
  try {
    const response = await apiRequest('POST', '/api/auth/login', credentials);
    const data = await response.json();
    return data.user;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Authentication failed');
  }
}

/**
 * Log out the current user
 * @returns Success message
 * @throws Error if logout fails
 */
export async function logout(): Promise<{ message: string }> {
  try {
    const response = await apiRequest('POST', '/api/auth/logout', {});
    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Logout failed');
  }
}

/**
 * Get the current authenticated user
 * @returns User object if authenticated, null otherwise
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error(`Failed to get current user: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if the user has a specific role
 * @param user User object to check
 * @param role Required role
 * @returns True if user has the required role, false otherwise
 */
export function hasRole(user: User | null, role: string | string[]): boolean {
  if (!user) return false;
  
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  
  return user.role === role;
}
