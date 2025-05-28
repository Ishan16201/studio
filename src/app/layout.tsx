
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppLayout from '@/components/layout/AppLayout';
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider

export const metadata: Metadata = {
  title: 'Grindset',
  description: 'Your personal dashboard for focus and growth.',
  manifest: '/manifest.json',
  // themeColor: '#000000', // Already set in globals.css effectively
  appleWebAppCapable: 'yes',
  appleWebAppStatusBarStyle: 'black-translucent',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} dark`}><body className="antialiased font-sans bg-background text-foreground">
      <AuthProvider> {/* Wrap AppLayout with AuthProvider */}
        <AppLayout>
          {children}
        </AppLayout>
        <Toaster />
      </AuthProvider>
    </body></html>
  );
}
