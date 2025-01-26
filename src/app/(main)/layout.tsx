import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import Footer from './base/Footer';
import Navbar from './base/Navbar';
import './globals.css';
import Providers from './providers';
import Gradient from '@/components/ui/gradient';

export const metadata: Metadata = {
  title: 'Student Portal',
  description:
    'Student Portal Limkokwing University of Creative Technology, Lesotho',
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
      <Gradient className='min-h-screen'>
        <Navbar />
        {children}
      </Gradient>
      <Footer />
      <Toaster />
    </Providers>
  );
}
