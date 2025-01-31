import { auth } from '@/auth';
import { Container } from '@/components/ui/container';
import { redirect } from 'next/navigation';

export default async function ClearancePage() {
  const session = await auth();

  if (!session?.user?.stdNo) {
    redirect('/register');
  }

  return (
    <Container>
      <div>ClearancePage</div>
    </Container>
  );
}
