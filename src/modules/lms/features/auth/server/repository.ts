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

	async setLmsUserId(userId: string, lmsUserId: number): Promise<void> {
		await db.update(users).set({ lmsUserId }).where(eq(users.id, userId));
	}

	async getUserByEmail(email: string) {
		return db.query.users.findFirst({
			where: eq(users.email, email),
		});
	}
}

export const lmsAuthRepository = new LmsAuthRepository();
