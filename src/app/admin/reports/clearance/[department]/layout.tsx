import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';

export default async function ClearanceReportsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { department: string };
}) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect('/login');
  }

  // Validate that the department is valid
  if (
    !['finance', 'library', 'registry', 'academic'].includes(params.department)
  ) {
    notFound();
  }

  return <>{children}</>;
}
