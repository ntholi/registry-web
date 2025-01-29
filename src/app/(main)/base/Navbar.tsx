'use client';
import { Container } from '@/components/ui/container';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Logo from './Logo';
import UserButton from './UserButton';

const exceptions = ['/login', '/signup'];

export default function Navbar() {
  const { status } = useSession();

  if (exceptions.includes(window.location.pathname)) return null;
  if (status === 'unauthenticated') return redirect('/login');

  return (
    <nav className='border-b p-2'>
      <Container width='lg' className='flex items-center justify-between py-0'>
        <div className='flex items-center'>
          <Link href='/'>
            <Logo className='mr-4 h-10 w-auto' />
          </Link>
        </div>
        <div className='flex items-center gap-4'>
          <div>
            <span className='text-sm font-medium text-muted-foreground'>
              9010XXXXX
            </span>
          </div>
          <UserButton />
        </div>
      </Container>
    </nav>
  );
}
