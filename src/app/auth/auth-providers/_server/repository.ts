import { eq } from 'drizzle-orm';
import { db, lmsCredentials } from '@/core/database';

export async function getLmsCredentials(userId: string) {
	return db.query.lmsCredentials.findFirst({
		where: eq(lmsCredentials.userId, userId),
	});
}

export async function upsertLmsCredentials(
	userId: string,
	lmsUserId: number | null | undefined,
	lmsToken: string | null | undefined
) {
	if (!lmsUserId && !lmsToken) {
		return db.delete(lmsCredentials).where(eq(lmsCredentials.userId, userId));
	}

	return db
		.insert(lmsCredentials)
		.values({
			userId,
			lmsUserId: lmsUserId ?? null,
			lmsToken: lmsToken ?? null,
		})
		.onConflictDoUpdate({
			target: lmsCredentials.userId,
			set: {
				lmsUserId: lmsUserId ?? null,
				lmsToken: lmsToken ?? null,
			},
		});
}

export async function hasLmsCredentials(userId: string) {
	const creds = await getLmsCredentials(userId);
	return !!(creds?.lmsUserId && creds?.lmsToken);
}
