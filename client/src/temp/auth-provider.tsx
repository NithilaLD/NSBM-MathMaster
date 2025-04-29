import React, { useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AuthContext, User } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { 
    data: userData, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: false, // We'll manually trigger this
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string; school?: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data);
      redirectBasedOnRole(data.role);
      toast({
        title: "Login Successful",
        description: `Welcome, ${data.username}!`,
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout");
      return res.json();
    },
    onSuccess: () => {
      setUser(null);
      setLocation("/");
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Logout Failed",
        description: error.message || "An error occurred during logout",
        variant: "destructive",
      });
    },
  });

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await refetch();
        if (result.data) {
          setUser(result.data);
        }
      } catch (error) {
        // User is not authenticated, do nothing
      }
    };
    
    checkAuth();
  }, [refetch]);

  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case "student":
        setLocation("/rules");
        break;
      case "admin":
        setLocation("/admin");
        break;
      case "superadmin":
        setLocation("/superadmin");
        break;
      default:
        setLocation("/");
    }
  };

  const login = async (username: string, password: string, school?: string) => {
    await loginMutation.mutateAsync({ username, password, school });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  // Update user when userData changes
  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
  }, [userData]);

  // Create a value object for the context provider
  const contextValue = {
    user,
    login,
    logout,
    isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending,
    isError
  };

  // Return the AuthContext provider with the value
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}