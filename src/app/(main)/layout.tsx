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
  return {
    title: `${toTitleCase(session?.user?.name?.split(' ')[0])}'s Portal | Limkokwing`,
    description: 'Student Portal | Limkokwing',
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
