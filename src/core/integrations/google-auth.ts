import { and, eq } from 'drizzle-orm';
import { google } from 'googleapis';
import { accounts, db } from '@/core/database';

export async function getOAuth2Client(userId: string) {
	const account = await db.query.accounts.findFirst({
		where: and(eq(accounts.userId, userId), eq(accounts.provider, 'google')),
	});

	if (!account) {
		throw new Error('Google account not connected');
	}

	const oauth2Client = new google.auth.OAuth2(
		process.env.AUTH_GOOGLE_ID,
		process.env.AUTH_GOOGLE_SECRET,
		`${process.env.AUTH_URL}/api/auth/callback/google`
	);

	if (!account.access_token) {
		throw new Error('No access token available. Please re-authenticate.');
	}

	oauth2Client.setCredentials({
		access_token: account.access_token,
		refresh_token: account.refresh_token || undefined,
		expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
	});

	oauth2Client.on('tokens', async (tokens) => {
		if (tokens.refresh_token) {
			await db
				.update(accounts)
				.set({
					refresh_token: tokens.refresh_token,
					access_token: tokens.access_token,
					expires_at: tokens.expiry_date
						? Math.floor(tokens.expiry_date / 1000)
						: null,
				})
				.where(
					and(eq(accounts.userId, userId), eq(accounts.provider, 'google'))
				);
		} else if (tokens.access_token) {
			await db
				.update(accounts)
				.set({
					access_token: tokens.access_token,
					expires_at: tokens.expiry_date
						? Math.floor(tokens.expiry_date / 1000)
						: null,
				})
				.where(
					and(eq(accounts.userId, userId), eq(accounts.provider, 'google'))
				);
		}
	});

	return oauth2Client;
}
