
'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"; // Import useToast

export default function LoginPage() {
  const { toast } = useToast(); // Initialize toast

  // Basic handler, full auth logic would be more complex
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: Implement Firebase login logic
    console.log("Login submitted");
    toast({
      title: "Login Attempted",
      description: "Login functionality is not yet implemented.",
    });
  };

  const handleForgotPassword = () => {
    // TODO: Implement Firebase password reset logic (e.g., sendPasswordResetEmail)
    console.log("Forgot password clicked");
    toast({
      title: "Forgot Password",
      description: "Password reset functionality is not yet implemented.",
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
              <Input id="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button 
                  type="button" // Important: type="button" to prevent form submission
                  variant="link" 
                  className="px-0 text-xs text-muted-foreground hover:text-primary"
                  onClick={handleForgotPassword}
                >
                  Forgot your password?
                </Button>
              </div>
              <Input id="password" type="password" placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full !mt-8" size="lg">
              Sign In
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

