import { db } from '@/db';
import {
  modules,
  modulePrerequisites,
  semesterModules,
  structureSemesters,
  studentPrograms,
} from '@/db/schema';
import {
  getCurrentSemester,
  getActiveProgram,
  AcademicRemarks,
  Student,
} from '@/lib/student-helpers';
import { getCurrentTerm } from '@/server/terms/actions';
import { and, eq, inArray, notInArray } from 'drizzle-orm';

type ModuleWithStatus = {
  id: number;
  code: string;
  name: string;
  type: string;
  credits: number;
  status: 'Compulsory' | 'Elective' | `Repeat${number}`;
  prerequisites?: Module[];
};

type Module = {
  code: string;
  name: string;
};

type SemesterModules = {
  modules: ModuleWithStatus[];
  semesterNo: number;
  semesterStatus: 'Active' | 'Repeat';
};

export async function getStudentSemesterModulesLogic(
  student: Student,
  remarks: AcademicRemarks,
): Promise<SemesterModules> {
  if (!student) {
    throw new Error('Student not found');
  }

  const activeProgram = getActiveProgram(student);
  if (!activeProgram) {
    throw new Error('No active program found for student');
  }

  const currentSemester = getCurrentSemester(student);
  const nextSemesterNumber = (currentSemester?.semesterNumber ?? 0) + 1;

  const term = await getCurrentTerm();
  const isSameParity =
    (term.semester % 2 === 0) === (nextSemesterNumber % 2 === 0);
  const actualNextSemester = isSameParity
    ? nextSemesterNumber
    : nextSemesterNumber - 1;

  const failedPrerequisites = await getFailedPrerequisites(
    remarks.failedModules,
    activeProgram.structureId,
  );
  const repeatModules = await getRepeatModules(remarks.failedModules);

  if (repeatModules.length >= 3) {
    return {
      modules: repeatModules,
      semesterNo: actualNextSemester,
      semesterStatus: 'Repeat',
    };
  }

  const attemptedModules = new Set(
    student.programs
      .flatMap((p) => p.semesters)
      .flatMap((s) => s.studentModules)
      .map((m) => m.semesterModule.module?.name),
  );

  const eligibleModules = await getNextSemesterModules(
    actualNextSemester,
    activeProgram.structureId,
  );

  const filteredModules = eligibleModules.filter(
    (m) => !attemptedModules.has(m.module?.name),
  );

  return {
    modules: [
      ...filteredModules.map(
        (m): ModuleWithStatus => ({
          id: m.id,
          code: m.module.code,
          name: m.module.name,
          type: m.type,
          credits: m.credits,
          status: m.type === 'Elective' ? 'Elective' : 'Compulsory',
          prerequisites: failedPrerequisites[m.module?.code] || [],
        }),
      ),
      ...repeatModules,
    ],
    semesterNo: actualNextSemester,
    semesterStatus: 'Active',
  };
}

function getFailedPrerequisites(fails: Module[], structureId: number) {}
