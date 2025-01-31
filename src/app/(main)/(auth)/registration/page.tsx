import { auth } from '@/auth';
import { Container } from '@/components/ui/container';
import { getRegistrationRequestByStdNo } from '@/server/registration-requests/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import { redirect } from 'next/navigation';

export default async function page() {
  const session = await auth();

  if (!session?.user?.stdNo) {
    redirect('/signup');
  }
  const term = await getCurrentTerm();
  const request = await getRegistrationRequestByStdNo(
    session.user.stdNo,
    term.id
  );

  if (!request) {
    redirect('/registration/request');
  }

  return (
    <Container className='pt-4 sm:pt-10'>
      <div>page</div>
    </Container>
  );
}
