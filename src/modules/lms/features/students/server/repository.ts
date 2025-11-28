import { and, eq, inArray, type SQL, sql } from 'drizzle-orm';
import {
	db,
	programs,
	structureSemesters,
	structures,
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

	async searchStudentsForEnrollment(
		searchCondition: SQL | undefined,
		currentTermName: string
	) {
		return db
			.select({
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
			.where(
				and(
					searchCondition,
					eq(studentPrograms.status, 'Active'),
					eq(studentSemesters.term, currentTermName)
				)
			)
			.limit(10);
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
}

export const studentRepository = new StudentRepository();
