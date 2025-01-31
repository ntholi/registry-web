import Gradient from '@/components/ui/gradient';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';
import { PropsWithChildren } from 'react';
import Footer from './base/Footer';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Student Portal',
  description:
    'Student Portal Limkokwing University of Creative Technology, Lesotho',
  icons: {
    icon: '/images/logo.png',
  },
  openGraph: {
    images: [
      {
        url: '/images/logo.png',
        width: 1371,
        height: 691,
      },
    ],
  },
};

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <Providers>
      <Gradient className='min-h-screen'>{children}</Gradient>
      <Footer />
      <Toaster />
    </Providers>
  );
}
