import { signOut } from '@/auth';
import { Button } from '@/components/ui/button';

export default function LogoutButton() {
  const handleLogout = async () => {
    'use server';
    await signOut();
  };

  return (
    <form action={handleLogout}>
      <Button variant={'ghost'} type='submit'>
        Logout
      </Button>
    </form>
  );
}
