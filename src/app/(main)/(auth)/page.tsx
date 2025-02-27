import { auth } from '@/auth';
import { Container } from '@/components/ui/container';
import { getStudentByUserId } from '@/server/students/actions';
import { AlertCircle } from 'lucide-react';
import Hero from './home/Hero';
import HomeLinks from './home/HomeLinks';
import { Session } from 'next-auth';
import Notifications from './home/Notifications';

export default async function Home() {
  const session = await auth();
  const student = await getStudentByUserId(session?.user?.id);
  await new Promise((resolve) => setTimeout(resolve, 3000));

  if (!student) {
    return <StudentNotFound session={session} />;
  }

  return (
    <Container width='lg' className='pt-4 sm:pt-10'>
      <Notifications />
      <Hero student={student} />
      <HomeLinks />
    </Container>
  );
}

function StudentNotFound({ session }: { session?: Session | null }) {
  return (
    <Container width='lg' className='pt-4 sm:pt-28'>
      <div className='mx-auto max-w-md py-10 text-center'>
        <AlertCircle className='mx-auto mb-4 size-16' />
        <h2 className='mb-4 text-3xl font-bold'>Student Not Found</h2>
        <p className='mb-6'>
          Student number: {session?.user?.stdNo || 'undefined'}
          <br />
          Role: {session?.user?.role || 'undefined'}
        </p>
      </div>
    </Container>
  );
}
