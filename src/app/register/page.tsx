
'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    // TODO: Implement Firebase registration logic here (e.g., createUserWithEmailAndPassword)
    console.log("Registration data:", data);
    toast({
      title: "Attempting Registration",
      description: "Creating your account...",
    });
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      if (user) {
        const db = getFirestore();
        await setDoc(doc(db, "users", user.uid), {
          name: data.name,
          email: user.email,
          createdAt: serverTimestamp()
        });
      }
      await login(data.email, data.password); // Log the user in after registration
    } catch (error) {
      console.error("Simulated registration/login failed:", error);
      toast({
        title: "Registration/Login Failed",
        description: "Could not process your registration. Please try again. (Simulated)",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-lg shadow-2xl rounded-xl">
        <CardHeader className="text-center bg-primary text-primary-foreground rounded-t-xl p-6">
          <div className="mx-auto bg-primary-foreground/20 p-3 rounded-full w-fit mb-3">
            <UserPlus className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Join Grindset and start achieving your goals.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="(123) 456-7890" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full !mt-8" size="lg" disabled={isLoading}>
                {isLoading ? 'Signing Up...' : 'Sign Up'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="p-6 flex flex-col items-center space-y-2 border-t">
          <div className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="underline text-primary hover:text-primary/80 font-semibold">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
