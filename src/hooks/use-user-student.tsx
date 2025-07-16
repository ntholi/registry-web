import { getStudentByUserId } from '@/server/students/actions';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function useUserStudent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: student } = useQuery({
    queryKey: ['student', session?.user?.id],
    queryFn: () => getStudentByUserId(session?.user?.id),
    enabled: !!session?.user?.id,
  });

  if (status === 'unauthenticated') {
    router.push('/login');
  }

  return student;
}
