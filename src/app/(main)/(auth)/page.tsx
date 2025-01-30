import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { getStudentByUserId } from '@/server/students/actions';
import { ClipboardList, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Hero from './home/Hero';

export default async function Home() {
  const session = await auth();
  const student = await getStudentByUserId(session?.user?.id);

  if (!student) return notFound();

  const links = [
    {
      href: '/register',
      icon: UserPlus,
      text: 'Register',
    },
    {
      href: '/transcripts',
      icon: ClipboardList,
      text: 'My Transcripts',
    },
  ];

  return (
    <Container width='lg' className='sm:pt-10'>
      <Hero student={student} />
      <div className='sm:mt-8 mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2'>
        {links.map((link, index) => (
          <Link key={index} href={link.href}>
            <Button
              variant='outline'
              className='w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-muted/50'
            >
              <link.icon className='size-6' />
              <span className='font-medium'>{link.text}</span>
            </Button>
          </Link>
        ))}
      </div>
    </Container>
  );
}
