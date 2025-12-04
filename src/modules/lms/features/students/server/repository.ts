import { and, eq, inArray, type SQL, sql } from 'drizzle-orm';
import {
	db,
	modules,
	programs,
	semesterModules,
	structureSemesters,
	structures,
	studentModules,
	studentPrograms,
	studentSemesters,
	students,
	users,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class StudentRepository extends BaseRepository<
	typeof students,
	'stdNo'
> {
	constructor() {
		super(students, students.stdNo);
	}

	async findEnrolledStudentsByLmsUserIds(lmsUserIds: number[]) {
		return db
			.selectDistinctOn([students.stdNo], {
				stdNo: students.stdNo,
				name: students.name,
				gender: students.gender,
				email: users.email,
				phone: students.phone1,
				programCode: programs.code,
				semesterNumber: structureSemesters.semesterNumber,
				lmsUserId: users.lmsUserId,
			})
			.from(users)
			.innerJoin(students, eq(students.userId, users.id))
			.innerJoin(studentPrograms, eq(studentPrograms.stdNo, students.stdNo))
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(
				studentSemesters,
				eq(studentSemesters.studentProgramId, studentPrograms.id)
			)
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.where(
				and(
					inArray(users.lmsUserId, lmsUserIds),
					eq(studentPrograms.status, 'Active')
				)
			)
			.orderBy(students.stdNo, sql`${structureSemesters.semesterNumber} DESC`);
	}

	async searchStudentsForEnrollment(searchCondition: SQL | undefined) {
		return db
			.selectDistinctOn([students.stdNo], {
				stdNo: students.stdNo,
				name: students.name,
				programName: programs.name,
				semesterNumber: structureSemesters.semesterNumber,
				userId: students.userId,
				lmsUserId: users.lmsUserId,
			})
			.from(students)
			.innerJoin(studentPrograms, eq(studentPrograms.stdNo, students.stdNo))
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(
				studentSemesters,
				eq(studentSemesters.studentProgramId, studentPrograms.id)
			)
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.leftJoin(users, eq(students.userId, users.id))
			.where(and(searchCondition, eq(studentPrograms.status, 'Active')))
			.orderBy(students.stdNo, sql`${structureSemesters.semesterNumber} DESC`)
			.limit(5);
	}

	async checkStudentEligibilityForCourse(
		stdNo: number,
		courseFullname: string,
		courseTerm: string
	) {
		const result = await db
			.select({
				stdNo: students.stdNo,
			})
			.from(students)
			.innerJoin(studentPrograms, eq(studentPrograms.stdNo, students.stdNo))
			.innerJoin(
				studentSemesters,
				eq(studentSemesters.studentProgramId, studentPrograms.id)
			)
			.innerJoin(
				studentModules,
				eq(studentModules.studentSemesterId, studentSemesters.id)
			)
			.innerJoin(
				semesterModules,
				eq(studentModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.where(
				and(
					eq(students.stdNo, stdNo),
					eq(studentPrograms.status, 'Active'),
					eq(studentSemesters.term, courseTerm),
					eq(modules.name, courseFullname)
				)
			)
			.limit(1);

		return result.length > 0;
	}

	async findStudentWithUser(stdNo: number) {
		return db.query.students.findFirst({
			where: eq(students.stdNo, stdNo),
			with: {
				user: true,
			},
		});
	}

	async updateUserLmsUserId(userId: string, lmsUserId: number) {
		return db.update(users).set({ lmsUserId }).where(eq(users.id, userId));
	}

	async findStudentsByLmsUserIdsForSubmissions(lmsUserIds: number[]) {
		if (lmsUserIds.length === 0) return [];
		return db
			.selectDistinctOn([users.lmsUserId], {
				stdNo: students.stdNo,
				name: students.name,
				lmsUserId: users.lmsUserId,
			})
			.from(users)
			.innerJoin(students, eq(students.userId, users.id))
			.where(inArray(users.lmsUserId, lmsUserIds))
			.orderBy(users.lmsUserId);
	}
}

export const studentRepository = new StudentRepository();
