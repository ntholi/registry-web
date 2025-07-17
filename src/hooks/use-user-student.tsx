import { StudentModuleStatus } from '@/db/schema';
import { getStudentByUserId } from '@/server/students/actions';
import {
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
    failedModules: filterFailedModules(student),
  };
}

function filterFailedModules(student: Student) {
  if (!student?.programs) return [];

  const failedModules = [];
  const passedModuleNames = new Set<string>();

  for (const program of student.programs) {
    if (!program.semesters) continue;
    for (const semester of program.semesters) {
      if (!semester.studentModules) continue;
      for (const studentModule of semester.studentModules) {
        if (['Delete', 'Drop'].includes(studentModule.status || '')) continue;
        if (studentModule.grade && isPassingGrade(studentModule.grade)) {
          const moduleName = studentModule.semesterModule?.module?.name;
          if (moduleName) {
            passedModuleNames.add(moduleName);
          }
        }
      }
    }
  }

  for (const program of student.programs) {
    if (!program.semesters) continue;
    for (const semester of program.semesters) {
      if (!semester.studentModules) continue;
      for (const studentModule of semester.studentModules) {
        if (['Delete', 'Drop'].includes(studentModule.status || '')) continue;
        if (studentModule.grade && isFailingOrSupGrade(studentModule.grade)) {
          const moduleName = studentModule.semesterModule?.module?.name;
          if (moduleName && !passedModuleNames.has(moduleName)) {
            failedModules.push({
              id: studentModule.id,
              semesterModuleId: studentModule.semesterModuleId,
              grade: studentModule.grade,
              marks: studentModule.marks,
              status: studentModule.status,
              module: studentModule.semesterModule?.module,
              credits: studentModule.semesterModule?.credits,
              type: studentModule.semesterModule?.type,
              semesterNumber: semester.semesterNumber,
              term: semester.term,
            });
          }
        }
      }
    }
  }

  return failedModules;
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
