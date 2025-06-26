import Gradient from '@/components/ui/gradient';
import { Toaster } from '@/components/ui/toaster';
import { PropsWithChildren } from 'react';
import Footer from './base/Footer';
import './globals.css';
import Providers from './providers';
import { Metadata } from 'next';
import { auth } from '@/auth';
import { toTitleCase } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();

  let displayName = `${toTitleCase(session?.user?.role)} Portal`;

  if (session?.user?.role === 'student') {
    const name = session?.user?.name?.split(' ')[0] || 'Student';
    displayName = `${toTitleCase(name)}'s Portal`;
  }

  return {
    title: `${displayName} | Limkokwing`,
    description: 'Limkokwing Student Portal',
    keywords: 'student, portal, limkokwing',
  };
}

export default async function MainLayout({ children }: PropsWithChildren) {
  return (
    <Providers>
      <Gradient className='min-h-[calc(100vh)] pb-8'>{children}</Gradient>
      <Footer />
      <Toaster />
    </Providers>
  );
}
