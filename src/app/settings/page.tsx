
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, UserCircle, Bell, Palette, ShieldCheck, LogOut } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// This is a placeholder. In a real app, this would come from auth state.
const MOCK_USER = {
  name: "Alex Grindset",
  email: "alex.grindset@example.com",
  avatarUrl: "https://placehold.co/100x100.png?text=AG", // Placeholder avatar
  aiHint: "person portrait"
};

export default function SettingsPage() {
  const { toast } = useToast();

  const handleSaveChanges = (section: string) => {
    // Placeholder for actual save logic
    toast({
      title: "Settings Saved",
      description: `${section} settings have been updated. (Demo)`,
    });
  };

  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-8">
      <header className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        </div>
        <p className="text-muted-foreground">Manage your account, preferences, and application settings.</p>
      </header>

      <div className="space-y-8">
        {/* Profile Section */}
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="border-b">
            <div className="flex items-center space-x-3">
              <UserCircle className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">Profile Information</CardTitle>
            </div>
            <CardDescription>Update your personal details.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={MOCK_USER.avatarUrl} alt={MOCK_USER.name} data-ai-hint={MOCK_USER.aiHint} />
                <AvatarFallback>{MOCK_USER.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm">Change Photo</Button>
                <p className="text-xs text-muted-foreground mt-1">JPG, GIF or PNG. 1MB max.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={MOCK_USER.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue={MOCK_USER.email} disabled />
                 <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
              </div>
            </div>
            <Button onClick={() => handleSaveChanges("Profile")}>Save Profile Changes</Button>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="border-b">
             <div className="flex items-center space-x-3">
              <Palette className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">Appearance</CardTitle>
            </div>
            <CardDescription>Customize the look and feel of the application.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="darkMode" className="flex flex-col space-y-1">
                <span>Dark Mode</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Currently enabled. (Theme is dark by default)
                </span>
              </Label>
              <Switch id="darkMode" checked={true} disabled aria-readonly />
            </div>
            {/* Add more appearance settings here, e.g., theme color picker */}
             <Button onClick={() => handleSaveChanges("Appearance")} disabled>Save Appearance Settings</Button>
          </CardContent>
        </Card>
        
        {/* Security Section */}
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="border-b">
             <div className="flex items-center space-x-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">Security</CardTitle>
            </div>
            <CardDescription>Manage your account security settings.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Button variant="outline">Change Password</Button>
            {/* Add 2FA settings here */}
             <p className="text-sm text-muted-foreground">Consider adding two-factor authentication for enhanced security.</p>
          </CardContent>
        </Card>

        {/* Logout Section */}
         <Card className="shadow-lg rounded-xl border-destructive/50">
          <CardHeader>
             <div className="flex items-center space-x-3">
                <LogOut className="h-6 w-6 text-destructive" />
                <CardTitle className="text-xl text-destructive">Log Out</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-4">Are you sure you want to log out of your account?</p>
            <Button variant="destructive" className="w-full sm:w-auto">
                Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
       <p className="text-center text-xs text-muted-foreground mt-10">
        Grindset v1.0.0 - Your settings, your control.
      </p>
    </div>
  );
}
