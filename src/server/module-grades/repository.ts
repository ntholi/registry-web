import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { moduleGrades } from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';

export default class ModuleGradeRepository extends BaseRepository<
	typeof moduleGrades,
	'id'
> {
	constructor() {
		super(moduleGrades, moduleGrades.id);
	}

	async findByModuleAndStudent(moduleId: number, stdNo: number) {
		return db.query.moduleGrades.findFirst({
			where: and(
				eq(moduleGrades.moduleId, moduleId),
				eq(moduleGrades.stdNo, stdNo)
			),
		});
	}

	async findByModuleId(moduleId: number) {
		return db.query.moduleGrades.findMany({
			where: eq(moduleGrades.moduleId, moduleId),
		});
	}

	async upsertModuleGrade(data: typeof moduleGrades.$inferInsert) {
		const existing = await this.findByModuleAndStudent(
			data.moduleId,
			data.stdNo
		);
		if (existing) {
			return db
				.update(moduleGrades)
				.set({
					grade: data.grade,
					weightedTotal: data.weightedTotal,
					updatedAt: new Date(),
				})
				.where(eq(moduleGrades.id, existing.id))
				.returning();
		} else {
			return db.insert(moduleGrades).values(data).returning();
		}
	}
}

export const moduleGradesRepository = new ModuleGradeRepository();
