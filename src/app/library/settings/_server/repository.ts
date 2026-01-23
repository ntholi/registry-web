import { eq } from 'drizzle-orm';
import { db } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';
import { librarySettings } from '../_schema/librarySettings';

export class LibrarySettingsRepository extends BaseRepository<
	typeof librarySettings,
	'id'
> {
	constructor() {
		super(librarySettings, librarySettings.id);
	}

	async getSettings() {
		return await db.query.librarySettings.findFirst();
	}

	async updateSettings(
		data: Partial<typeof librarySettings.$inferInsert>,
		userId: string
	) {
		const existing = await this.getSettings();
		if (existing) {
			const [updated] = await db
				.update(this.table)
				.set({ ...data, updatedAt: new Date(), updatedBy: userId })
				.where(eq(this.primaryKey, existing.id))
				.returning();
			return updated;
		}

		const [created] = await db
			.insert(this.table)
			.values({ ...data, createdBy: userId })
			.returning();
		return created;
	}
}
