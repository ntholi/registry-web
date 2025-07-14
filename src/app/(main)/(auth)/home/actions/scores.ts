import { ModuleStatus } from '@/db/schema';
import { getStudentByUserId } from '@/server/students/actions';
import { summarizeModules } from '@/utils/grades';

type Student = NonNullable<Awaited<ReturnType<typeof getStudentByUserId>>>;

export async function getStudentScore(student: Student) {
  const program = student.programs.find((it) => it.status === 'Active');

  if (!program) {
    return {
      cgpa: 0,
      creditsCompleted: 0,
    };
  }

  const modules = program.semesters.flatMap((sem) =>
    sem.studentModules.map((sm) => ({
      grade: sm.grade,
      credits: Number(sm.semesterModule.credits),
      status: (sm as { status?: ModuleStatus }).status,
    })),
  );

  const summary = summarizeModules(modules);

  return {
    cgpa: Number(summary.gpa),
    creditsCompleted: summary.creditsCompleted,
  };
}
