import { eq } from 'drizzle-orm';
import { db, users } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class AuthUserRepository extends BaseRepository<
	typeof users,
	'id'
> {
	constructor() {
		super(users, users.id);
	}

	async findIdsByPresetId(presetId: string) {
		const rows = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.presetId, presetId));

		return rows.map((row) => row.id);
	}

	async getPresetId(userId: string) {
		const [row] = await db
			.select({ presetId: users.presetId })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		return row?.presetId ?? null;
	}
}

export const authUsersRepository = new AuthUserRepository();
