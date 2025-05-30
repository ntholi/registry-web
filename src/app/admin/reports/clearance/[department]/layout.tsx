import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';

type Props = {
  children: React.ReactNode;
  params: Promise<{ department: string }>;
};
export default async function Layout({ children, params }: Props) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect('/login');
  }

  const { department } = await params;

  if (!['finance', 'library'].includes(department)) {
    notFound();
  }

  return <>{children}</>;
}
