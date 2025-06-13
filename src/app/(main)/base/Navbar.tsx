'use client';
import { Container } from '@/components/ui/container';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Logo from './Logo';
import UserButton from './UserButton';
import { Button } from '@/components/ui/button';

const exceptions = ['/login', '/signup'];

export default function Navbar() {
  const { status, data: session } = useSession();

  if (exceptions.includes(window.location.pathname)) return null;
  // Do not render navbar while auth status is unauthenticated or loading
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
