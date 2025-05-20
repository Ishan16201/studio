import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppLayout from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'Grindset',
  description: 'Your personal dashboard for focus and growth.',
  manifest: '/manifest.json',
  themeColor: '#111827', // Dark theme color
  appleWebAppCapable: 'yes',
  appleWebAppStatusBarStyle: 'black-translucent',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} dark`}> {/* Added dark class */}
      <body className="antialiased font-sans bg-background text-foreground">
        <AppLayout>
          {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
