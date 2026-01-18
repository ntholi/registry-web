import { count, eq, ilike } from 'drizzle-orm';
import { db, subjectAliases, subjectGrades, subjects } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class SubjectRepository extends BaseRepository<
	typeof subjects,
	'id'
> {
	constructor() {
		super(subjects, subjects.id);
	}

	async findByName(name: string) {
		const trimmedName = name.trim();

		const byName = await db.query.subjects.findFirst({
			where: ilike(subjects.name, trimmedName),
		});
		if (byName) return byName;

		const alias = await db.query.subjectAliases.findFirst({
			where: ilike(subjectAliases.alias, trimmedName),
			with: { subject: true },
		});
		return alias?.subject ?? null;
	}

	async findOrCreateByName(name: string) {
		const trimmedName = name.trim();

		const existing = await this.findByName(trimmedName);
		if (existing) return existing;

		const [created] = await db
			.insert(subjects)
			.values({ name: trimmedName })
			.returning();
		return created;
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
