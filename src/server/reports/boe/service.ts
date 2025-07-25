// import { db } from '@/db';
// import { Grade, moduleGrades, StudentModuleStatus, schools } from '@/db/schema';
// import { termsRepository } from '@/server/terms/repository';
// import { summarizeModules, getAcademicRemarks } from '@/utils/grades';
// import { and, inArray } from 'drizzle-orm';
// import ExcelJS from 'exceljs';
// import { boeReportRepository, ProgramSemesterReport } from './repository';
// import { createWorksheet } from './worksheet';

// type School = typeof schools.$inferSelect;
// type StudentSemester = Awaited<
//   ReturnType<typeof boeReportRepository.getStudentSemestersForFaculty>
// >[number];

// type ModuleForRemarks = {
//   code: string;
//   name: string;
//   grade: string;
//   credits: number;
//   status: StudentModuleStatus;
//   semesterNumber: number;
//   semesterModuleId: number;
// };

// type SemesterModuleData = {
//   semesterNumber: number;
//   modules: ModuleForRemarks[];
// };

// export default class BoeReportService {
//   private repository = boeReportRepository;
//   async generateBoeReportForFaculty(school: School): Promise<Buffer> {
//     const currentTerm = await termsRepository.getActive();
//     if (!currentTerm) {
//       throw new Error('No active term found');
//     }

//     const studentSemesters =
//       await this.repository.getStudentSemestersForFaculty(
//         school.id,
//         currentTerm.name,
//       );

//     const programGroups = this.groupByProgram(
//       studentSemesters as StudentSemester[],
//     );

//     const workbook = new ExcelJS.Workbook();

//     for (const [programId, programSemesters] of Object.entries(programGroups)) {
//       const semesterGroups = this.groupBySemesterNumber(programSemesters);

//       for (const [semesterNumber, semesters] of Object.entries(
//         semesterGroups,
//       )) {
//         const updatedCurrentSemesters = await this.mapCurrentSemesterGrades(
//           semesters as StudentSemester[],
//         );

//         const studentNumbers = updatedCurrentSemesters.map(
//           (s) => s.studentProgram.student.stdNo,
//         );
//         const allStudentSemesters =
//           await this.repository.getStudentSemesterHistoryForStudents(
//             studentNumbers,
//           );

//         const programReport: ProgramSemesterReport = {
//           programId: parseInt(programId),
//           programCode:
//             semesters[0]?.studentProgram.structure.program.code || '',
//           programName:
//             semesters[0]?.studentProgram.structure.program.name || '',
//           semesterNumber: parseInt(semesterNumber),
//           students: this.createStudentReports(
//             updatedCurrentSemesters,
//             allStudentSemesters as StudentSemester[],
//             parseInt(semesterNumber),
//           ),
//         };

//         const year = Math.ceil(parseInt(semesterNumber) / 2);
//         const semester = parseInt(semesterNumber) % 2 === 0 ? 2 : 1;
//         const sheetName = `${programReport.programCode}Y${year}S${semester}`;
//         const worksheet = workbook.addWorksheet(sheetName);

//         createWorksheet(
//           worksheet,
//           programReport,
//           school.name,
//           currentTerm.name,
//         );
//       }
//     }

//     const buffer = await workbook.xlsx.writeBuffer();
//     return Buffer.from(buffer);
//   }
//   private async mapCurrentSemesterGrades(semesters: StudentSemester[]) {
//     semesters.forEach((semester) => {
//       semester.studentModules.forEach((studentModule) => {
//         studentModule.grade = 'NM' as Grade;
//         studentModule.marks = '';
//       });
//     });

//     const moduleStudentPairs: Array<{
//       moduleId: number;
//       stdNo: number;
//       semesterModuleId: number;
//     }> = [];

//     semesters.forEach((semester) => {
//       const student = semester.studentProgram.student;
//       semester.studentModules.forEach((studentModule) => {
//         if (studentModule.semesterModule.moduleId) {
//           moduleStudentPairs.push({
//             moduleId: studentModule.semesterModule.moduleId,
//             stdNo: student.stdNo,
//             semesterModuleId: studentModule.semesterModuleId,
//           });
//         }
//       });
//     });

//     if (moduleStudentPairs.length === 0) {
//       return semesters;
//     }

//     const moduleIds = [...new Set(moduleStudentPairs.map((p) => p.moduleId))];
//     const stdNos = [...new Set(moduleStudentPairs.map((p) => p.stdNo))];

//     const moduleGradesData = await db.query.moduleGrades.findMany({
//       where: and(
//         inArray(moduleGrades.moduleId, moduleIds),
//         inArray(moduleGrades.stdNo, stdNos),
//       ),
//     });

//     const gradesMap = new Map<
//       string,
//       { grade: Grade; weightedTotal: number }
//     >();
//     moduleGradesData.forEach((gradeData) => {
//       const key = `${gradeData.moduleId}-${gradeData.stdNo}`;
//       gradesMap.set(key, {
//         grade: gradeData.grade,
//         weightedTotal: gradeData.weightedTotal,
//       });
//     });

//     semesters.forEach((semester) => {
//       const student = semester.studentProgram.student;
//       semester.studentModules.forEach((studentModule) => {
//         if (studentModule.semesterModule.moduleId) {
//           const key = `${studentModule.semesterModule.moduleId}-${student.stdNo}`;
//           const gradeData = gradesMap.get(key);

//           if (gradeData) {
//             studentModule.grade = gradeData.grade;
//             studentModule.marks = gradeData.weightedTotal.toString();
//           }
//         }
//       });
//     });

//     return semesters;
//   }

//   private groupBySemesterNumber(studentSemesters: StudentSemester[]) {
//     return studentSemesters.reduce(
//       (groups, semester) => {
//         const semesterNumber = semester.semesterNumber || 0;
//         if (!groups[semesterNumber]) {
//           groups[semesterNumber] = [];
//         }
//         groups[semesterNumber].push(semester);
//         return groups;
//       },
//       {} as Record<string, StudentSemester[]>,
//     );
//   }

//   private groupByProgram(studentSemesters: StudentSemester[]) {
//     return studentSemesters.reduce(
//       (groups, semester) => {
//         const programId = semester.studentProgram.structure.program.id;
//         if (!groups[programId]) {
//           groups[programId] = [];
//         }
//         groups[programId].push(semester);
//         return groups;
//       },
//       {} as Record<string, StudentSemester[]>,
//     );
//   }
//   private createStudentReports(
//     semesters: StudentSemester[],
//     allStudentSemesters: StudentSemester[],
//     currentSemesterNumber: number,
//   ) {
//     const studentReports = semesters.map((semester) => {
//       const student = semester.studentProgram.student;
//       const studentSemesters = allStudentSemesters.filter(
//         (s) => s.studentProgram.student.stdNo === student.stdNo,
//       );

//       const allModules = studentSemesters.flatMap((s) => s.studentModules);
//       const currentModules = semester.studentModules;

//       const allSummary = summarizeModules(allModules);
//       const currentSummary = summarizeModules(currentModules);

//       const currentSemesterModules = currentModules.map((sm) => ({
//         code: sm.semesterModule.module?.code || '',
//         name: sm.semesterModule.module?.name || '',
//         grade: sm.grade,
//         credits: Number(sm.semesterModule.credits),
//         status: (sm.status as StudentModuleStatus) || 'Active',
//       }));

//       const historicalSemesters: SemesterModuleData[] = [];
//       const semesterGroups = new Map<number, ModuleForRemarks[]>();

//       studentSemesters.forEach((ss) => {
//         const semNum = ss.semesterNumber || 0;
//         if (!semesterGroups.has(semNum)) {
//           semesterGroups.set(semNum, []);
//         }

//         ss.studentModules.forEach((sm) => {
//           semesterGroups.get(semNum)!.push({
//             code: sm.semesterModule.module?.code || '',
//             name: sm.semesterModule.module?.name || '',
//             grade: sm.grade,
//             credits: Number(sm.semesterModule.credits),
//             status: (sm.status as StudentModuleStatus) || 'Active',
//             semesterNumber: semNum,
//             semesterModuleId: sm.semesterModuleId,
//           });
//         });
//       });

//       historicalSemesters.push(
//         ...Array.from(semesterGroups.entries()).map(
//           ([semesterNumber, modules]) => ({
//             semesterNumber,
//             modules,
//           }),
//         ),
//       );

//       // Convert student data to Program format for getAcademicRemarks
//       //TODO: EVERYTHING DOWN HERE IS RUBBISH, REDO THE WHOLE FUNCTION
//       const programData = [
//         {
//           id: semester.studentProgram.structure.program.id,
//           status: 'Active' as const,
//           structureId: semester.studentProgram.structure.id,
//           structure: {
//             id: semester.studentProgram.structure.id,
//             code: semester.studentProgram.structure.code,
//             program: {
//               name: semester.studentProgram.structure.program.name,
//             },
//           },
//           semesters: studentSemesters.map((ss) => ({
//             id: ss.id,
//             term: ss.term,
//             semesterNumber: ss.semesterNumber,
//             status: ss.status,
//             studentModules: ss.studentModules.map((sm) => ({
//               id: sm.id,
//               semesterModuleId: sm.semesterModuleId,
//               grade: sm.grade,
//               marks: sm.marks,
//               status: sm.status,
//               semesterModule: {
//                 credits: sm.semesterModule.credits,
//                 type: sm.semesterModule.type,
//                 module: sm.semesterModule.module
//                   ? {
//                       code: sm.semesterModule.module.code,
//                       name: sm.semesterModule.module.name,
//                     }
//                   : null,
//               },
//             })),
//           })),
//         },
//       ];

//       const facultyRemarksResult = getAcademicRemarks(programData);

//       return {
//         studentId: student.stdNo,
//         studentName: student.name,
//         studentModules: currentModules.map((sm) => ({
//           studentId: student.stdNo,
//           studentName: student.name,
//           moduleCode: sm.semesterModule.module?.code || '',
//           moduleName: sm.semesterModule.module?.name || '',
//           credits: sm.semesterModule.credits,
//           marks: sm.marks,
//           grade: sm.grade,
//         })),
//         modulesCount: currentModules.length,
//         creditsAttempted: currentSummary.creditsAttempted,
//         creditsEarned: currentSummary.creditsCompleted,
//         totalPoints: currentSummary.points,
//         gpa: currentSummary.gpa,
//         cgpa: allSummary.gpa,
//         facultyRemark: facultyRemarksResult.message,
//       };
//     });

//     return studentReports.sort((a, b) => b.cgpa - a.cgpa);
//   }
// }

// export const boeReportService = new BoeReportService();
