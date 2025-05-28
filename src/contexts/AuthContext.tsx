
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email?: string, password?: string) => Promise<void>; // Parameters for eventual Firebase auth
  logout: () => Promise<void>;
  // user: any; // Replace 'any' with your User type if you have one
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true
  const router = useRouter();

  useEffect(() => {
    // Simulate checking auth status (e.g., from localStorage or an API)
    const checkAuthStatus = async () => {
      setIsLoading(true);
      // In a real app, you'd check a token, Firebase auth state, etc.
      // For simulation, we'll assume logged out initially or check a flag.
      const storedAuth = localStorage.getItem('grindset_isAuthenticated');
      if (storedAuth === 'true') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };
    checkAuthStatus();
  }, []);


  const login = async (email?: string, password?: string) => {
    // Simulate API call or Firebase login
    console.log("Simulating login with:", email); // Keep for debug
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    setIsAuthenticated(true);
    localStorage.setItem('grindset_isAuthenticated', 'true');
    setIsLoading(false);
    router.push('/'); // Redirect to dashboard after login
  };

  const logout = async () => {
    // Simulate API call or Firebase logout
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
    setIsAuthenticated(false);
    localStorage.removeItem('grindset_isAuthenticated');
    setIsLoading(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
