import { auth } from '@/auth';
import { Container } from '@/components/ui/container';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Logo from './Logo';
import UserButton from './UserButton';

export default async function Navbar() {
  const session = await auth();
  if (!session) return redirect('/login');
  // if (!session.user?.student) return redirect('/signup');

  return (
    <nav className='border-b p-2'>
      <Container width='lg' className='flex items-center justify-between'>
        <div className='flex items-center'>
          <Link href='/student'>
            <Logo className='mr-4 h-14 w-auto' />
          </Link>
        </div>
        <UserButton />
      </Container>
    </nav>
  );
}
