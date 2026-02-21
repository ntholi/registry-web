import { desc, eq } from 'drizzle-orm';
import { db, termSettings, terms } from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export type TermInsert = typeof terms.$inferInsert;
export type TermSettingsInsert = typeof termSettings.$inferInsert;
export type TermQueryOptions = QueryOptions<typeof terms>;

export default class TermRepository extends BaseRepository<typeof terms, 'id'> {
	constructor() {
		super(terms, terms.id);
	}

	async getByCode(code: string) {
		return db.query.terms.findFirst({
			where: eq(terms.code, code),
			with: { settings: true },
		});
	}

	async findAll() {
		const result = await db
			.select()
			.from(this.table as unknown as typeof terms)
			.orderBy(desc(terms.code));
		return result;
	}

	async getActive() {
		return db.query.terms.findFirst({
			where: eq(terms.isActive, true),
			with: { settings: true },
		});
	}

	async createWithSettings(data: TermInsert, userId?: string) {
		return db.transaction(async (tx) => {
			await this.clearActiveIfNeeded(data.isActive, tx);
			const [created] = await tx.insert(this.table).values(data).returning();
			await tx.insert(termSettings).values({
				termId: created.id,
				createdBy: userId,
			});
			return created;
		});
	}

	async update(id: number, data: Partial<TermInsert>) {
		return db.transaction(async (tx) => {
			await this.clearActiveIfNeeded(data.isActive, tx);
			const [updated] = (await tx
				.update(this.table)
				.set(data)
				.where(eq(this.primaryKey, id))
				.returning()) as (typeof terms.$inferSelect)[];
			return updated;
		});
	}

	private async clearActiveIfNeeded(
		isActive?: boolean,
		executor: { update: typeof db.update } = db
	) {
		if (!isActive) {
			return;
		}
		await executor
			.update(terms)
			.set({ isActive: false })
			.where(eq(terms.isActive, true));
	}
}

export const termsRepository = new TermRepository();
