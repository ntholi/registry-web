import { getStudentByUserId } from '@/server/students/actions';
import { getAcademicRemarks } from '@/utils/grades';
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
    studentProgram: getActiveProgram(student),
    programName: getActiveProgram(student)?.structure.program.name,
    remarks: getAcademicRemarks(student?.programs ?? []),
    semester: getCurrentSemester(student),
  };
}

function getActiveProgram(student: Student | null) {
  if (!student) return null;
  const activeProgram = student.programs
    .sort((a, b) => b.id - a.id)
    .filter((p) => p.status === 'Active');
  return activeProgram[0];
}

function getCurrentSemester(student: Student | null) {
  if (!student) return null;
  const activeProgram = getActiveProgram(student);
  return activeProgram?.semesters.sort((a, b) => {
    if (a.semesterNumber && b.semesterNumber) {
      return b.semesterNumber - a.semesterNumber;
    }
    return 0;
  })[0];
}
