import { signOut } from '@/auth';
import { Button } from '@/components/ui/button';
import { IconLogout } from '@tabler/icons-react';

export default function LogoutButton() {
  const handleLogout = async () => {
    'use server';
    await signOut();
  };

  return (
    <form action={handleLogout}>
      <Button type='submit' variant={'outline'}>
        <IconLogout />
        Log Out
      </Button>
    </form>
  );
}
