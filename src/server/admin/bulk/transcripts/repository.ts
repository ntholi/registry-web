import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { db } from '@/core/database';
import { programs, structures, studentPrograms } from '@/core/database/schema';

export default class BulkRepository {
	async findDistinctGraduationDates() {
		const result = await db
			.select({
				graduationDate: studentPrograms.graduationDate,
			})
			.from(studentPrograms)
			.where(
				and(
					eq(studentPrograms.status, 'Completed'),
					isNotNull(studentPrograms.graduationDate)
				)
			)
			.groupBy(studentPrograms.graduationDate)
			.orderBy(sql`${studentPrograms.graduationDate} DESC`);

		return result
			.map((row) => row.graduationDate)
			.filter((date): date is string => date !== null);
	}

	async findProgramsByGraduationDate(graduationDate: string) {
		const result = await db
			.select({
				programId: programs.id,
				programCode: programs.code,
				programName: programs.name,
				programLevel: programs.level,
			})
			.from(studentPrograms)
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.where(
				and(
					eq(studentPrograms.status, 'Completed'),
					eq(studentPrograms.graduationDate, graduationDate)
				)
			)
			.groupBy(programs.id, programs.code, programs.name, programs.level)
			.orderBy(programs.name);

		return result;
	}

	async findStudentsByGraduationDate(
		graduationDate: string,
		programIds?: number[]
	) {
		const conditions = [
			eq(studentPrograms.status, 'Completed'),
			eq(studentPrograms.graduationDate, graduationDate),
		];

		if (programIds && programIds.length > 0) {
			const result = await db
				.select({
					stdNo: studentPrograms.stdNo,
				})
				.from(studentPrograms)
				.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
				.where(and(...conditions, inArray(structures.programId, programIds)));

			return result
				.map((row) => row.stdNo)
				.filter((stdNo): stdNo is number => stdNo !== null);
		}

		const result = await db.query.studentPrograms.findMany({
			where: and(...conditions),
			with: {
				student: {
					columns: {
						stdNo: true,
					},
				},
			},
		});

		return result
			.map((program) => program.student?.stdNo)
			.filter((stdNo): stdNo is number => stdNo !== undefined);
	}
}
