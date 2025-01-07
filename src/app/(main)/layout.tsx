import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import Footer from './base/Footer';
import './globals.css';
import Providers from './providers';
import Navbar from './base/Navbar';

export const metadata: Metadata = {
  title: 'Graduation Clearance',
  description: 'Limkokwing Registry App, for Graduation Clearance',
  icons: {
    icon: '/logo.png',
  },
  openGraph: {
    images: [
      {
        url: '/logo.png',
        width: 1371,
        height: 691,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body suppressHydrationWarning>
        <SessionProvider>
          <Providers>
            <Navbar />
            {children}
            <Footer />
            <Toaster />
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
