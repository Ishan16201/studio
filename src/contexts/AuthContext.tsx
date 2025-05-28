
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  name: string;
  email?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email?: string, password?: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LAST_ACTIVE_KEY = 'grindset_lastActiveTimestamp';
const IS_AUTHENTICATED_KEY = 'grindset_isAuthenticated';
const USER_DETAILS_KEY = 'grindset_userDetails';
const INACTIVITY_LOGOUT_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days

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
      console.log('[AuthContext] Starting auth status check...');
      setIsLoading(true);
      try {
        const storedAuth = localStorage.getItem(IS_AUTHENTICATED_KEY);
        const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
        const storedUserDetails = localStorage.getItem(USER_DETAILS_KEY);
        let currentlyAuth = storedAuth === 'true';

        if (currentlyAuth && lastActive) {
          const lastActiveTime = parseInt(lastActive, 10);
          if (Date.now() - lastActiveTime > INACTIVITY_LOGOUT_DURATION) {
            console.log("[AuthContext] User inactive for too long, logging out.");
            currentlyAuth = false;
            localStorage.removeItem(IS_AUTHENTICATED_KEY);
            localStorage.removeItem(LAST_ACTIVE_KEY);
            localStorage.removeItem(USER_DETAILS_KEY);
          }
        } else if (currentlyAuth && !lastActive) {
          updateLastActive();
        }

        if (currentlyAuth) {
          setIsAuthenticated(true);
          if (storedUserDetails) {
            const parsedUser = JSON.parse(storedUserDetails);
            setUser(parsedUser);
            console.log('[AuthContext] User authenticated from localStorage. User:', parsedUser);
          } else {
            // Fallback, though USER_DETAILS_KEY should exist if IS_AUTHENTICATED_KEY is true
            const fallbackUser = { name: "User" };
            setUser(fallbackUser);
            console.log('[AuthContext] User authenticated from localStorage, but no details found. Using fallback. User:', fallbackUser);
          }
          updateLastActive();
        } else {
          setIsAuthenticated(false);
          setUser(null);
          console.log('[AuthContext] User not authenticated or session expired.');
        }
      } catch (error) {
        console.error("[AuthContext] Error during auth status check:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        console.log('[AuthContext] Finished auth status check. isLoading will be set to false.');
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []);


  const login = async (email?: string, password?: string, name?: string) => {
    console.log("[AuthContext] Simulating login for:", name || email);
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsAuthenticated(true);
    
    const currentUserName = name || (user?.name) || "User";
    const loggedInUser: User = { name: currentUserName, email: email };
    setUser(loggedInUser);

    localStorage.setItem(IS_AUTHENTICATED_KEY, 'true');
    localStorage.setItem(USER_DETAILS_KEY, JSON.stringify(loggedInUser));
    updateLastActive();
    setIsLoading(false);
    console.log("[AuthContext] Login successful, navigating to /");
    router.push('/');
  };

  const logout = async () => {
    console.log("[AuthContext] Logging out...");
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem(IS_AUTHENTICATED_KEY);
    localStorage.removeItem(LAST_ACTIVE_KEY);
    localStorage.removeItem(USER_DETAILS_KEY);
    setIsLoading(false);
    console.log("[AuthContext] Logout complete, navigating to /login");
    router.push('/login');
  };

  useEffect(() => {
    const activityHandler = () => {
      if (isAuthenticated) {
        updateLastActive();
      }
    };
    window.addEventListener('focus', activityHandler);
    window.addEventListener('mousemove', activityHandler);
    window.addEventListener('keydown', activityHandler);
    return () => {
      window.removeEventListener('focus', activityHandler);
      window.removeEventListener('mousemove', activityHandler);
      window.removeEventListener('keydown', activityHandler);
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
