import { getStudentByUserId } from '@/server/students/actions';
import { getAcademicRemarks } from '@/utils/grades';

export type Student = Awaited<ReturnType<typeof getStudentByUserId>>;
export type AcademicRemarks = Awaited<ReturnType<typeof getAcademicRemarks>>;

export function getActiveProgram(student: Student | null) {
  if (!student) return null;
  const activeProgram = student.programs
    .sort((a, b) => b.id - a.id)
    .filter((p) => p.status === 'Active');
  return activeProgram[0];
}

export function getCurrentSemester(student: Student | null) {
  if (!student) return null;
  const activeProgram = getActiveProgram(student);
  return activeProgram?.semesters.sort((a, b) => {
    if (a.semesterNumber && b.semesterNumber) {
      return b.semesterNumber - a.semesterNumber;
    }
    return 0;
  })[0];
}
