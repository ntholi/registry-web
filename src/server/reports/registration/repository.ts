import { db } from '@/db';
import {
  studentSemesters,
  studentPrograms,
  students,
  programs,
  schools,
  structures,
  terms,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export interface FullRegistrationStudent {
  stdNo: number;
  name: string;
  programName: string;
  semesterNumber: number;
  schoolName: string;
  status: string;
}

export interface SummaryProgramData {
  programName: string;
  schoolName: string;
  schoolId: number;
  yearBreakdown: { [year: number]: number };
  totalStudents: number;
}

export interface SummarySchoolData {
  schoolName: string;
  totalStudents: number;
  programs: SummaryProgramData[];
}

export interface FullRegistrationReport {
  termName: string;
  totalStudents: number;
  students: FullRegistrationStudent[];
  generatedAt: Date;
}

export interface SummaryRegistrationReport {
  termName: string;
  totalStudents: number;
  schools: SummarySchoolData[];
  generatedAt: Date;
}

export class RegistrationReportRepository {
  async getFullRegistrationData(
    termName: string
  ): Promise<FullRegistrationStudent[]> {
    const result = await db
      .select({
        stdNo: students.stdNo,
        name: students.name,
        programName: programs.name,
        semesterNumber: studentSemesters.semesterNumber,
        schoolName: schools.name,
        status: studentSemesters.status,
      })
      .from(studentSemesters)
      .innerJoin(
        studentPrograms,
        eq(studentSemesters.studentProgramId, studentPrograms.id)
      )
      .innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
      .innerJoin(structures, eq(studentPrograms.structureId, structures.id))
      .innerJoin(programs, eq(structures.programId, programs.id))
      .innerJoin(schools, eq(programs.schoolId, schools.id))
      .where(eq(studentSemesters.term, termName));

    return result.map((row) => ({
      stdNo: row.stdNo,
      name: row.name,
      programName: row.programName,
      semesterNumber: row.semesterNumber || 0,
      schoolName: row.schoolName,
      status: row.status,
    }));
  }

  async getPaginatedRegistrationData(
    termName: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    students: FullRegistrationStudent[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    const offset = (page - 1) * pageSize;

    const [studentsResult, totalResult] = await Promise.all([
      db
        .select({
          stdNo: students.stdNo,
          name: students.name,
          programName: programs.name,
          semesterNumber: studentSemesters.semesterNumber,
          schoolName: schools.name,
          status: studentSemesters.status,
        })
        .from(studentSemesters)
        .innerJoin(
          studentPrograms,
          eq(studentSemesters.studentProgramId, studentPrograms.id)
        )
        .innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
        .innerJoin(structures, eq(studentPrograms.structureId, structures.id))
        .innerJoin(programs, eq(structures.programId, programs.id))
        .innerJoin(schools, eq(programs.schoolId, schools.id))
        .where(eq(studentSemesters.term, termName))
        .limit(pageSize)
        .offset(offset),

      db
        .select({ count: students.stdNo })
        .from(studentSemesters)
        .innerJoin(
          studentPrograms,
          eq(studentSemesters.studentProgramId, studentPrograms.id)
        )
        .innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
        .where(eq(studentSemesters.term, termName)),
    ]);

    const totalCount = totalResult.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      students: studentsResult.map((row) => ({
        stdNo: row.stdNo,
        name: row.name,
        programName: row.programName,
        semesterNumber: row.semesterNumber || 0,
        schoolName: row.schoolName,
        status: row.status,
      })),
      totalCount,
      totalPages,
      currentPage: page,
    };
  }

  async getSummaryRegistrationData(
    termName: string
  ): Promise<SummaryRegistrationReport> {
    const fullData = await this.getFullRegistrationData(termName);

    const schoolsMap = new Map<string, SummarySchoolData>();
    const programsMap = new Map<string, SummaryProgramData>();

    fullData.forEach((student) => {
      const schoolKey = student.schoolName;
      const programKey = `${student.programName}_${student.schoolName}`;

      if (!schoolsMap.has(schoolKey)) {
        schoolsMap.set(schoolKey, {
          schoolName: student.schoolName,
          totalStudents: 0,
          programs: [],
        });
      }

      if (!programsMap.has(programKey)) {
        programsMap.set(programKey, {
          programName: student.programName,
          schoolName: student.schoolName,
          schoolId: 0,
          yearBreakdown: {},
          totalStudents: 0,
        });
      }

      const program = programsMap.get(programKey)!;
      const year = student.semesterNumber;

      if (!program.yearBreakdown[year]) {
        program.yearBreakdown[year] = 0;
      }

      program.yearBreakdown[year]++;
      program.totalStudents++;

      const school = schoolsMap.get(schoolKey)!;
      school.totalStudents++;
    });

    const schools = Array.from(schoolsMap.values())
      .map((school) => ({
        ...school,
        programs: Array.from(programsMap.values())
          .filter((program) => program.schoolName === school.schoolName)
          .sort((a, b) => a.programName.localeCompare(b.programName)),
      }))
      .sort((a, b) => a.schoolName.localeCompare(b.schoolName));

    return {
      termName,
      totalStudents: fullData.length,
      schools,
      generatedAt: new Date(),
    };
  }

  async getTermById(termId: number) {
    const [term] = await db
      .select()
      .from(terms)
      .where(eq(terms.id, termId))
      .limit(1);

    return term;
  }

  async getAllActiveTerms() {
    return await db.select().from(terms).orderBy(terms.createdAt);
  }
}
