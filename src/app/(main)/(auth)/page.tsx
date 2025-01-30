import { auth } from '@/auth';
import { Container } from '@/components/ui/container';
import { getStudentByUserId } from '@/server/students/actions';
import { notFound } from 'next/navigation';
import Hero from './home/Hero';
import HomeLinks from './home/HomeLinks';

export default async function Home() {
  const session = await auth();
  const student = await getStudentByUserId(session?.user?.id);

  if (!student) return notFound();

  return (
    <Container width='lg' className='pt-4 sm:pt-10'>
      <Hero student={student} />
      <HomeLinks />
    </Container>
  );
}
