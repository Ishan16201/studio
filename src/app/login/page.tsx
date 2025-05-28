
'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import React, { useState } from 'react'; // Import useState

export default function LoginPage() {
  const { toast } = useToast();
  const { login, isLoading } = useAuth(); // Get login function and isLoading state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing Fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    try {
      await login(email, password); // login function from AuthContext now handles redirect
      // toast({ // Optional: success toast, or let redirect speak for itself
      //   title: "Login Successful",
      //   description: "Welcome back!",
      // });
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Login Failed",
        description: "Could not log in. Please check your credentials or try again later. (Simulated)",
        variant: "destructive",
      });
    }
  };

  const handleForgotPassword = () => {
    // TODO: Implement Firebase password reset logic
    console.log("Forgot password clicked");
    toast({
      title: "Forgot Password",
      description: "Password reset functionality is not yet implemented. (Simulated - would send OTP)",
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl rounded-xl">
        <CardHeader className="text-center bg-primary text-primary-foreground rounded-t-xl p-6">
          <div className="mx-auto bg-primary-foreground/20 p-3 rounded-full w-fit mb-3">
            <LogIn className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Sign in to access your Grindset dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button 
                  type="button"
                  variant="link" 
                  className="px-0 text-xs text-muted-foreground hover:text-primary"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  Forgot your password?
                </Button>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full !mt-8" size="lg" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="p-6 flex flex-col items-center space-y-2 border-t">
          <div className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="underline text-primary hover:text-primary/80 font-semibold">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
