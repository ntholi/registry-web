import { count, eq, ilike, sql } from 'drizzle-orm';
import { db, subjectAliases, subjectGrades, subjects } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class SubjectRepository extends BaseRepository<
	typeof subjects,
	'id'
> {
	constructor() {
		super(subjects, subjects.id);
	}

	override async findById(id: string) {
		return db.query.subjects.findFirst({
			where: eq(subjects.id, id),
			with: { aliases: true },
		});
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

		const [result] = await db
			.insert(subjects)
			.values({ name: trimmedName })
			.onConflictDoUpdate({
				target: subjects.name,
				set: { updatedAt: sql`now()` },
			})
			.returning();
		return result;
	}

	async isInUse(id: string): Promise<boolean> {
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

	async toggleActive(id: string) {
		const subject = await this.findById(id);
		if (!subject) return null;
		return db
			.update(subjects)
			.set({ isActive: !subject.isActive })
			.where(eq(subjects.id, id))
			.returning()
			.then((rows) => rows[0]);
	}

	async addAlias(subjectId: string, alias: string) {
		const [created] = await db
			.insert(subjectAliases)
			.values({ subjectId, alias: alias.trim() })
			.returning();
		return created;
	}

	async removeAlias(aliasId: string) {
		await db.delete(subjectAliases).where(eq(subjectAliases.id, aliasId));
	}

	async getAliases(subjectId: string) {
		return db.query.subjectAliases.findMany({
			where: eq(subjectAliases.subjectId, subjectId),
			orderBy: (a, { asc }) => [asc(a.alias)],
		});
	}

	async moveToAlias(sourceId: string, targetId: string) {
		const source = await this.findById(sourceId);
		if (!source) throw new Error('Source subject not found');

		await db.transaction(async (tx) => {
			await tx.insert(subjectAliases).values({
				subjectId: targetId,
				alias: source.name,
			});

			await tx
				.update(subjectGrades)
				.set({ subjectId: targetId })
				.where(eq(subjectGrades.subjectId, sourceId));

			await tx
				.update(subjects)
				.set({ isActive: false })
				.where(eq(subjects.id, sourceId));
		});
	}
}
