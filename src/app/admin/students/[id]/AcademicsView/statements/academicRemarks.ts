import { StudentModuleStatus } from '@/db/schema';
import { calculateFacultyRemarks, FacultyRemarksResult } from '@/utils/grades';

type StudentModule = {
  id: number;
  semesterModuleId: number;
  grade: string;
  marks: string;
  status: string;
  semesterModule: {
    credits: number;
    type: string;
    module?: {
      code: string;
      name: string;
    } | null;
  };
};

type Semester = {
  id: number;
  term: string;
  semesterNumber: number | null;
  status: string;
  studentModules?: StudentModule[];
};

type Program = {
  id: number;
  status: string;
  structureId: number;
  semesters?: Semester[];
  structure: {
    id: number;
    code: string;
    program: {
      name: string;
    };
  };
};

function extractSemesterNumber(term: string): number {
  const match = term.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function getNextSemesterNumber(programs: Program[]): number {
  let maxSemester = 0;

  programs.forEach((program) => {
    program.semesters?.forEach((semester) => {
      const semesterNum = extractSemesterNumber(semester.term);
      if (semesterNum > maxSemester) {
        maxSemester = semesterNum;
      }
    });
  });

  return maxSemester + 1;
}

export function calculateDetailedFacultyRemarks(
  programs: Program[],
): FacultyRemarksResult {
  const activePrograms = programs.filter(
    (program) => program.status === 'Active',
  );

  const filteredPrograms = activePrograms.map((program) => ({
    ...program,
    semesters: program.semesters
      ?.filter(
        (semester) =>
          !['Deleted', 'Deferred', 'DroppedOut'].includes(semester.status),
      )
      .map((semester) => ({
        ...semester,
        studentModules: semester.studentModules?.filter(
          (module) => !['Delete', 'Drop'].includes(module.status),
        ),
      })),
  }));

  // Convert to new data structure
  const semesterData = convertToSemesterModuleData(filteredPrograms);
  const nextSemesterNumber = getNextSemesterNumber(filteredPrograms);

  // Get the latest semester modules for current semester analysis
  let latestSemesterNumber = 0;
  let latestSemesterModules: (ModuleForRemarks & {
    code: string;
    name: string;
  })[] = [];

  filteredPrograms.forEach((program) => {
    program.semesters?.forEach((semester) => {
      const semesterNum = extractSemesterNumber(semester.term);
      if (semesterNum > latestSemesterNumber) {
        latestSemesterNumber = semesterNum;
        latestSemesterModules =
          semester.studentModules?.map((module) => ({
            code:
              module.semesterModule.module?.code ??
              `ID:${module.semesterModuleId}`,
            name:
              module.semesterModule.module?.name ??
              `Semester Module ID: ${module.semesterModuleId}`,
            grade: module.grade,
            credits: module.semesterModule.credits,
            status: module.status as StudentModuleStatus,
            semesterNumber: semesterNum,
            semesterModuleId: module.semesterModuleId,
          })) ?? [];
      }
    });
  });
  // Use the new shared calculation logic
  return calculateFacultyRemarks(filteredPrograms);
}
