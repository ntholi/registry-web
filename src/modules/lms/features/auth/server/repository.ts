import { eq } from 'drizzle-orm';
import { db, users } from '@/core/database';
import { moodleGet } from '@/core/integrations/moodle';

type MoodleUser = {
	id: number;
	username: string;
	email: string;
	firstname: string;
	lastname: string;
};

class LmsAuthRepository {
	async getLmsUserId(userId: string): Promise<number | null> {
		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
			columns: { lmsUserId: true },
		});
		return user?.lmsUserId ?? null;
	}

	async findMoodleUserByEmail(email: string): Promise<MoodleUser | null> {
		const result = await moodleGet('core_user_get_users', {
			'criteria[0][key]': 'email',
			'criteria[0][value]': email,
		});

		if (!result?.users || result.users.length === 0) {
			return null;
		}

		return result.users[0] as MoodleUser;
	}

	async linkMoodleAccount(userId: string, lmsUserId: number): Promise<void> {
		await db.update(users).set({ lmsUserId }).where(eq(users.id, userId));
	}
}

export const lmsAuthRepository = new LmsAuthRepository();
