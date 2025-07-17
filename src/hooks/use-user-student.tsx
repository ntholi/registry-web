import { getStudentByUserId } from '@/server/students/actions';
import { getAcademicRemarks } from '@/utils/grades';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function useUserStudent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: student, isLoading } = useQuery({
    queryKey: ['student', session?.user?.id],
    queryFn: () => getStudentByUserId(session?.user?.id),
    staleTime: 1000 * 60 * 15,
    enabled: !!session?.user?.id,
  });

  if (status === 'unauthenticated') {
    router.push('/login');
  }

  return {
    isLoading: status === 'loading' || isLoading,
    user: session?.user,
    student,
    remarks: getAcademicRemarks(student?.programs ?? []),
  };
}
