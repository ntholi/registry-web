import { auth } from '@/auth';
import { Container } from '@/components/ui/container';
import { getStudentByUserId } from '@/server/students/actions';
import { AlertCircle } from 'lucide-react';
import { Session } from 'next-auth';
import Hero from './home/Hero';
import HomeLinks from './home/HomeLinks';
import Notifications from './home/Notifications';

export default async function Home() {
  const session = await auth();
  const student = await getStudentByUserId(session?.user?.id);

  if (session && !student) {
    return <StudentNotFound session={session} />;
  }

  if (!student) {
    return (
      <div className='flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4'>
        <div className='flex w-full max-w-md flex-col items-center space-y-8 rounded-xl p-10'>
          <div className='space-y-2 text-center'>
            <h1 className='text-4xl font-bold'>Student Portal</h1>
            <h2 className='text-muted-foreground'>Limkokwing Student Portal</h2>
          </div>

          <p>Loading...</p>
        </div>
      </div>
    );
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
