'use client';
import { Container } from '@/components/ui/container';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Logo from './Logo';
import UserButton from './UserButton';

const exceptions = ['/login', '/register'];

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
          <span className='text-xs text-muted-foreground'>901011676</span>
          <UserButton />
        </div>
      </Container>
    </nav>
  );
}
