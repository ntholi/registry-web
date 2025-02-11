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

  if (!student) {
    return <StudentNotFound session={session} />;
  }

  return (
    <Container width='lg' className='pt-4 sm:pt-10'>
      <Hero student={student} />
      <Notifications />
      <HomeLinks />
    </Container>
  );
}

function StudentNotFound({ session }: { session?: Session | null }) {
  return (
    <Container width='lg' className='pt-4 sm:pt-28'>
      <div className='text-center py-10 max-w-md mx-auto'>
        <AlertCircle className='size-16 mx-auto mb-4' />
        <h2 className='text-3xl font-bold mb-4'>Student Not Found</h2>
        <p className='mb-6'>
          Student number: {session?.user?.stdNo || 'undefined'}
          <br />
          Role: {session?.user?.role || 'undefined'}
        </p>
      </div>
    </Container>
  );
}
