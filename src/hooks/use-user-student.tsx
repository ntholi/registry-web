import { StudentModuleStatus } from '@/db/schema';
import { getStudentByUserId } from '@/server/students/actions';
import {
  getAcademicRemarks,
  isFailingOrSupGrade,
  isPassingGrade,
  summarizeModules,
} from '@/utils/grades';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Student = Awaited<ReturnType<typeof getStudentByUserId>>;

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
    scores: getScores(student),
    remarks: getAcademicRemarks(student?.programs ?? []),
  };
}

function getScores(student: Student | undefined) {
  const program = student?.programs.find((it) => it.status === 'Active');
  if (!program) {
    return {
      cgpa: 0,
      creditsCompleted: 0,
    };
  }
  const modules = program.semesters.flatMap((sem) => sem.studentModules);

  const summary = summarizeModules(modules);

  return {
    cgpa: Number(summary.gpa),
    creditsCompleted: summary.creditsCompleted,
  };
}
