import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans'; // Geist is already sans-serif
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppLayout from '@/components/layout/AppLayout'; // Import AppLayout

// const geistSans = GeistSans({ // This initialization is not needed for 'geist/font/sans'
//   variable: '--font-geist-sans',
//   subsets: ['latin'],
// });

export const metadata: Metadata = {
  title: 'Grindset',
  description: 'Your personal dashboard for focus and growth.',
  // Add PWA related meta tags for better mobile experience
  manifest: '/manifest.json',
  themeColor: '#1A237E',
  appleWebAppCapable: 'yes',
  appleWebAppStatusBarStyle: 'black-translucent',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="antialiased font-sans">
        <AppLayout>
          {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
