import { getAcademicRemarks } from '@/utils/grades';

export type Student = {
  stdNo: number;
  programs: {
    id: number;
    status: string;
    structure: {
      program: {
        name: string;
        code: string;
        school: {
          name: string;
        };
      };
    };
    semesters: {
      id: number;
      semesterNumber?: number | null;
    }[];
  }[];
};

export type AcademicRemarks = Awaited<ReturnType<typeof getAcademicRemarks>>;

export function getActiveProgram(student: Student | null) {
  if (!student) return null;
  const activeProgram = student.programs
    .sort((a, b) => b.id - a.id)
    .filter((p) => p.status === 'Active');
  const program = activeProgram[0];
  return {
    name: program.structure.program.name,
    code: program.structure.program.code,
    schoolName: program.structure.program.school.name,
    ...program,
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
