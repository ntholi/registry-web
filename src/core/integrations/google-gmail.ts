import { and, eq } from 'drizzle-orm';
import { google } from 'googleapis';
import { accounts, db } from '@/core/database';
import { getOAuth2Client } from './google-auth';

export async function hasGmailScope(userId: string): Promise<boolean> {
	const account = await db.query.accounts.findFirst({
		where: and(eq(accounts.userId, userId), eq(accounts.provider, 'google')),
	});

	if (!account || !account.scope) {
		return false;
	}

	return account.scope.includes('https://www.googleapis.com/auth/gmail.modify');
}

export async function getConnectedEmail(
	userId: string
): Promise<string | null> {
	const auth = await getOAuth2Client(userId);
	const gmail = google.gmail({ version: 'v1', auth });
	const profile = await gmail.users.getProfile({ userId: 'me' });
	return profile.data.emailAddress ?? null;
}
