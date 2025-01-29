import './globals.css';
import Gradient from '@/components/ui/gradient';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import Footer from './base/Footer';
import Providers from './providers';
import { PropsWithChildren } from 'react';
import { auth } from '@/auth';
import { dashboardUsers } from '@/db/schema';
import { redirect } from 'next/navigation';

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
  const session = await auth();

  if (session?.user?.role && dashboardUsers.includes(session.user.role)) {
    redirect('/admin');
  }

  return (
    <Providers>
      <Gradient className='min-h-screen'>{children}</Gradient>
      <Footer />
      <Toaster />
    </Providers>
  );
}
