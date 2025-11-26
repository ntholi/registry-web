import { eq } from 'drizzle-orm';
import { db, users } from '@/core/database';

class LmsAuthRepository {
	async getLmsUserId(userId: string): Promise<number | null> {
		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
			columns: { lmsUserId: true },
		});
		return user?.lmsUserId ?? null;
	}
}

export const lmsAuthRepository = new LmsAuthRepository();
