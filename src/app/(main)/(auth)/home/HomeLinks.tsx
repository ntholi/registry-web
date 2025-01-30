import { Button } from '@/components/ui/button';
import { ClipboardList, UserPlus } from 'lucide-react';
import Link from 'next/link';

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

export default function HomeLinks() {
  return (
    <div className='sm:mt-8 mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2'>
      {links.map(({ href, icon: Icon, text }, index) => (
        <Link key={index} href={href}>
          <Button
            variant='outline'
            className='w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-muted/50'
          >
            <Icon className='w-6 h-6' />
            <span className='font-medium'>{text}</span>
          </Button>
        </Link>
      ))}
    </div>
  );
}
