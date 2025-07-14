import { auth } from '@/auth';
import { Container } from '@/components/ui/container';
import { redirect } from 'next/navigation';
import Hero from './home/Hero';
import HomeLinks from './home/HomeLinks';
import Notifications from './home/Notifications';

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect('/login');
  }

  return (
    <Container width='lg' className='pt-4 sm:pt-10'>
      <Notifications />
      <Hero userId={session.user.id} />
      <HomeLinks />
    </Container>
  );
}
