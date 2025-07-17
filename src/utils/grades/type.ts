import { SemesterStatus, StudentModuleStatus } from '@/db/schema';

export type Program = {
  id: number;
  status: string;
  structureId: number;
  semesters: {
    id: number;
    term: string;
    semesterNumber: number | null;
    status: SemesterStatus;
    studentModules: {
      id: number;
      semesterModuleId: number;
      grade: string;
      marks: string;
      status: StudentModuleStatus;
      semesterModule: {
        credits: number;
        type: string;
        module: {
          code: string;
          name: string;
        };
      };
    }[];
  }[];
  structure: {
    id: number;
    code: string;
    program: {
      name: string;
    };
  };
};
