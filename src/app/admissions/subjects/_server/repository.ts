import { count, eq } from 'drizzle-orm';
import { db, subjectGrades, subjects } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class SubjectRepository extends BaseRepository<
	typeof subjects,
	'id'
> {
	constructor() {
		super(subjects, subjects.id);
	}

	async isInUse(id: number): Promise<boolean> {
		const [result] = await db
			.select({ total: count() })
			.from(subjectGrades)
			.where(eq(subjectGrades.subjectId, id));
		return result.total > 0;
	}

	async findActive() {
		return db.query.subjects.findMany({
			where: eq(subjects.isActive, true),
			orderBy: (s, { asc }) => [asc(s.name)],
		});
	}

	async toggleActive(id: number) {
		const subject = await this.findById(id);
		if (!subject) return null;
		return db
			.update(subjects)
			.set({ isActive: !subject.isActive })
			.where(eq(subjects.id, id))
			.returning()
			.then((rows) => rows[0]);
	}
}
