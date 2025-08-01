import { getStudentByUserId } from '@/server/students/actions';
import { getAcademicRemarks } from '@/utils/grades';

export type Student = NonNullable<
  Awaited<ReturnType<typeof getStudentByUserId>>
>;

export type AcademicRemarks = Awaited<ReturnType<typeof getAcademicRemarks>>;

export function getActiveProgram(student: Student | null | undefined) {
  if (!student) return null;
  const activeProgram = student.programs
    .sort((a, b) => b.id - a.id)
    .find((p) => p.status === 'Active');

  if (!activeProgram) return null;

  return {
    ...activeProgram,
    name: activeProgram.structure.program.name,
    code: activeProgram.structure.program.code,
    schoolName: activeProgram.structure.program.school.name,
  };
}

export function getCurrentSemester(student: Student | null | undefined) {
  if (!student) return null;
  const activeProgram = getActiveProgram(student);
  return activeProgram?.semesters.sort((a, b) => b.id - a.id)[0];
}

export function getNextSemesterNo(student: Student | null) {
  if (!student) return 1;

  const allSemesters = student.programs.flatMap((program) => program.semesters);
  const maxSemesterNo = Math.max(
    ...allSemesters.map((semester) => semester.semesterNumber || 0)
  );
  return maxSemesterNo + 1;
}
