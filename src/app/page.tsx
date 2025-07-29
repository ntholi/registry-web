import { auth } from '@/auth';
import { dashboardUsers } from '@/db/schema';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    const role = session.user.role;

    if (role === 'student') {
      redirect('/student');
    } else if (role !== 'user' && [...dashboardUsers].includes(role)) {
      redirect('/admin');
    } else {
      redirect('/account-setup');
    }
  }

  redirect('/login');
}
