import { ModuleStatus } from '@/db/schema';
import {
  calculateFacultyRemarks,
  FacultyRemarksResult,
  ModuleForRemarks,
  SemesterModuleData,
} from '@/utils/grades';

type StudentModule = {
  grade: string;
  status: string;
  semesterModule: {
    credits: number;
    module?: {
      code: string;
      name: string;
    } | null;
  };
  semesterModuleId: number;
};

type Semester = {
  id: number;
  term: string;
  status: string;
  studentModules?: StudentModule[];
};

type Program = {
  id: number;
  status: string;
  semesters?: Semester[];
  structure: {
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

function convertToSemesterModuleData(
  programs: Program[],
): SemesterModuleData[] {
  const semesterDataMap = new Map<number, ModuleForRemarks[]>();

  programs.forEach((program) => {
    program.semesters?.forEach((semester) => {
      const semesterNumber = extractSemesterNumber(semester.term);

      if (!semesterDataMap.has(semesterNumber)) {
        semesterDataMap.set(semesterNumber, []);
      }

      const modules = semesterDataMap.get(semesterNumber)!;

      semester.studentModules?.forEach((module) => {
        if (!['Delete', 'Drop'].includes(module.status)) {
          modules.push({
            code:
              module.semesterModule.module?.code ??
              `ID:${module.semesterModuleId}`,
            name:
              module.semesterModule.module?.name ??
              `Semester Module ID: ${module.semesterModuleId}`,
            grade: module.grade,
            credits: module.semesterModule.credits,
            status: module.status as ModuleStatus,
            semesterNumber,
            semesterModuleId: module.semesterModuleId,
          });
        }
      });
    });
  });

  return Array.from(semesterDataMap.entries()).map(
    ([semesterNumber, modules]) => ({
      semesterNumber,
      modules,
    }),
  );
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
            status: module.status as ModuleStatus,
            semesterNumber: semesterNum,
            semesterModuleId: module.semesterModuleId,
          })) ?? [];
      }
    });
  });
  // Use the new shared calculation logic
  return calculateFacultyRemarks(
    latestSemesterModules,
    semesterData.filter((s) => s.semesterNumber < latestSemesterNumber),
    nextSemesterNumber,
  );
}
