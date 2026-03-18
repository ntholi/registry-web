'use server';

import { eq } from 'drizzle-orm';
import { google } from 'googleapis';
import { db, mailAccountAssignments, mailAccounts } from '@/core/database';
import { getSession } from '@/core/platform/withPermission';
import { createAction } from '@/shared/lib/actions/actionResult';

export async function getUserMailAccounts() {
	const session = await getSession();
	if (!session?.user?.id) return [];

	return db
		.select({
			id: mailAccounts.id,
			email: mailAccounts.email,
			displayName: mailAccounts.displayName,
			isPrimary: mailAccounts.isPrimary,
			isActive: mailAccounts.isActive,
			createdAt: mailAccounts.createdAt,
		})
		.from(mailAccounts)
		.where(eq(mailAccounts.userId, session.user.id));
}

export const revokeMailAccount = createAction(async (mailAccountId: string) => {
	const session = await getSession();
	if (!session?.user?.id) {
		throw new Error('Not authenticated');
	}

	const [account] = await db
		.select({
			id: mailAccounts.id,
			userId: mailAccounts.userId,
			accessToken: mailAccounts.accessToken,
			isPrimary: mailAccounts.isPrimary,
		})
		.from(mailAccounts)
		.where(eq(mailAccounts.id, mailAccountId))
		.limit(1);

	if (!account) {
		throw new Error('Mail account not found');
	}

	const isOwner = account.userId === session.user.id;
	const isAdmin = session.user.role === 'admin';

	if (!isOwner && !isAdmin) {
		throw new Error('You do not have permission to revoke this email');
	}

	if (account.isPrimary) {
		console.warn(
			`Primary mail account ${mailAccountId} is being revoked. Admin must reassign.`
		);
	}

	if (account.accessToken) {
		try {
			const oauth2Client = new google.auth.OAuth2();
			await oauth2Client.revokeToken(account.accessToken);
		} catch {
			// Best-effort revocation
		}
	}

	await db.transaction(async (tx) => {
		await tx
			.delete(mailAccountAssignments)
			.where(eq(mailAccountAssignments.mailAccountId, mailAccountId));

		await tx.delete(mailAccounts).where(eq(mailAccounts.id, mailAccountId));
	});

	return { revoked: true };
});
