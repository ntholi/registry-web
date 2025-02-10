import { Button } from '@/components/ui/button';
import { ClipboardList, UserPlus } from 'lucide-react';
import Link from 'next/link';

const links = [
  {
    href: '/registration',
    icon: UserPlus,
    text: 'Registration',
  },
  {
    href: '/transcripts',
    icon: ClipboardList,
    text: 'My Transcripts',
  },
];

export default function HomeLinks() {
  return (
    <div className='mt-4 grid gap-2.5 sm:gap-4 grid-cols-1 sm:grid-cols-2'>
      {links.map(({ href, icon: Icon, text }, index) => (
        <Link key={index} href={href}>
          <Button
            variant='outline'
            className='w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 rounded-xl sm:rounded-lg'
          >
            <Icon className='size-6' />
            <span className='font-medium'>{text}</span>
          </Button>
        </Link>
      ))}
    </div>
  );
}
