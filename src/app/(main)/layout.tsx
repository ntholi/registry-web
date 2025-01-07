import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import Footer from './base/Footer';
import Navbar from './base/Navbar';
import './globals.css';
import Providers from './providers';

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
    <Providers>
      <Navbar />
      <div className='min-h-[87vh]'>{children}</div>
      <Footer />
      <Toaster />
    </Providers>
  );
}
