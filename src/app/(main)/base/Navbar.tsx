'use client';
import { Container } from '@/components/ui/container';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Logo from './Logo';
import UserButton from './UserButton';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const exceptions = ['/login', '/signup'];

export default function Navbar() {
  const { status, data: session } = useSession();

  if (exceptions.includes(window.location.pathname)) return null;
  if (status === 'loading') {
    return (
      <nav className='border-b p-2'>
        <Container
          width='lg'
          className='flex items-center justify-between py-0'
        >
          <div className='flex items-center gap-2'>
            <Skeleton className='h-10 w-24' />
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-10 w-10 rounded-full' />
          </div>
        </Container>
      </nav>
    );
  }
  if (status !== 'authenticated') return null;

  return (
    <nav className='border-b p-2'>
      <Container width='lg' className='flex items-center justify-between py-0'>
        <div className='flex items-center'>
          <Link href='/'>
            <Logo className='mr-4 h-10 w-auto' />
          </Link>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='link' asChild>
            <Link href='/profile'>{session?.user?.stdNo}</Link>
          </Button>
          <UserButton />
        </div>
      </Container>
    </nav>
  );
}
