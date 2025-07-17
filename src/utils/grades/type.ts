import {
  SemesterStatus,
  StudentModuleStatus,
  StudentProgramStatus,
} from '@/db/schema';

export type StudentModule = {
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
    } | null;
  };
};

export type Program = {
  id: number;
  status: StudentProgramStatus;
  structureId: number;
  semesters: {
    id: number;
    term: string;
    semesterNumber: number | null;
    status: SemesterStatus;
    studentModules: StudentModule[];
  }[];
  structure: {
    id: number;
    code: string;
    program: {
      name: string;
    };
  };
};

export type GradePoint = {
  semesterId: number;
  gpa: number;
  cgpa: number;
  creditsAttempted: number;
  creditsCompleted: number;
};

export type FacultyRemarksResult = {
  status: 'Proceed' | 'Remain in Semester' | 'No Marks';
  failedModules: {
    code: string;
    name: string;
  }[];
  supplementaryModules: {
    code: string;
    name: string;
  }[];
  message: string;
  details: string;
  totalModules: number;
  totalCreditsAttempted: number;
  totalCreditsCompleted: number;
  points: GradePoint[];
  latestPoints: GradePoint;
};
