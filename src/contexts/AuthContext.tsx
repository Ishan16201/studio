
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  name: string;
  // Add other user properties here, e.g., email
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LAST_ACTIVE_KEY = 'grindset_lastActiveTimestamp';
const IS_AUTHENTICATED_KEY = 'grindset_isAuthenticated';
const INACTIVITY_LOGOUT_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const updateLastActive = () => {
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      const storedAuth = localStorage.getItem(IS_AUTHENTICATED_KEY);
      const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
      let currentlyAuth = storedAuth === 'true';

      if (currentlyAuth && lastActive) {
        const lastActiveTime = parseInt(lastActive, 10);
        if (Date.now() - lastActiveTime > INACTIVITY_LOGOUT_DURATION) {
          console.log("User inactive for too long, logging out.");
          currentlyAuth = false;
          localStorage.removeItem(IS_AUTHENTICATED_KEY);
          localStorage.removeItem(LAST_ACTIVE_KEY);
          setUser(null);
        }
      } else if (currentlyAuth && !lastActive) {
        // If authenticated but no last active timestamp, set it now
        updateLastActive();
      }


      if (currentlyAuth) {
        setIsAuthenticated(true);
        // In a real app, fetch user details here. For now, mock it.
        setUser({ name: "Alex Grindset" }); // Placeholder name
        updateLastActive(); // Update last active time on load if authenticated
      } else {
        setIsAuthenticated(false);
        setUser(null);
        // No need to redirect here, ProtectedRoute will handle it
      }
      setIsLoading(false);
    };
    checkAuthStatus();
  }, []);


  const login = async (email?: string, password?: string) => {
    console.log("Simulating login with:", email);
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsAuthenticated(true);
    // Mock user, replace with actual user data from Firebase Auth in a real app
    const mockUser: User = { name: "Alex Grindset" }; // Placeholder name
    setUser(mockUser);
    localStorage.setItem(IS_AUTHENTICATED_KEY, 'true');
    updateLastActive();
    setIsLoading(false);
    router.push('/');
  };

  const logout = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem(IS_AUTHENTICATED_KEY);
    localStorage.removeItem(LAST_ACTIVE_KEY);
    setIsLoading(false);
    router.push('/login');
  };

  // Update last active timestamp on user activity (could be expanded)
  // For simplicity, we mainly update on load when authenticated and on login.
  // More robust activity tracking could involve listening to global events.
  useEffect(() => {
    const activityHandler = () => {
      if (isAuthenticated) {
        updateLastActive();
      }
    };
    // Example: update on window focus or specific interactions
    window.addEventListener('focus', activityHandler);
    // Add other event listeners if needed e.g. mousemove, keydown
    return () => {
      window.removeEventListener('focus', activityHandler);
    };
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
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
