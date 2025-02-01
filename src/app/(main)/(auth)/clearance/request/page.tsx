import { auth } from '@/auth';
import { Container } from '@/components/ui/container';
import { redirect } from 'next/navigation';
import ClearanceRequestForm from './form';

export default async function Page() {
  const session = await auth();

  if (!session?.user?.stdNo) {
    redirect('/signup');
  }

  return (
    <Container width='sm' className='pt-4 sm:pt-10'>
      <ClearanceRequestForm stdNo={session.user.stdNo} />
    </Container>
  );
}
