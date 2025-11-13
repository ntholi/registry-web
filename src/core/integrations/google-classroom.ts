import { and, eq } from 'drizzle-orm';
import { google } from 'googleapis';
import { auth } from '@/core/auth';
import { db } from '@/core/database';
import { accounts } from '@/core/database/schema';

async function getOAuth2Client(userId: string) {
	const account = await db.query.accounts.findFirst({
		where: and(eq(accounts.userId, userId), eq(accounts.provider, 'google')),
	});

	if (!account) {
		throw new Error('Google account not connected');
	}

	if (!account.access_token || !account.refresh_token) {
		throw new Error(
			'Google Classroom not authorized. Please visit /api/auth/google-classroom to authorize.'
		);
	}

	const hasClassroomScope = account.scope?.includes(
		'https://www.googleapis.com/auth/classroom.courses'
	);
	if (!hasClassroomScope) {
		throw new Error(
			'Google Classroom scope not authorized. Please visit /api/auth/google-classroom to authorize.'
		);
	}

	const oauth2Client = new google.auth.OAuth2(
		process.env.AUTH_GOOGLE_ID,
		process.env.AUTH_GOOGLE_SECRET,
		`${process.env.AUTH_URL}/api/auth/callback/google`
	);

	oauth2Client.setCredentials({
		access_token: account.access_token,
		refresh_token: account.refresh_token,
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

export async function hasGoogleClassroomScope(
	userId: string
): Promise<boolean> {
	const account = await db.query.accounts.findFirst({
		where: and(eq(accounts.userId, userId), eq(accounts.provider, 'google')),
	});

	if (!account || !account.scope || !account.refresh_token) {
		return false;
	}

	return account.scope.includes(
		'https://www.googleapis.com/auth/classroom.courses'
	);
}

async function googleClassroom() {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const authClient = await getOAuth2Client(session.user.id);
	return google.classroom({ version: 'v1', auth: authClient });
}

export default googleClassroom;
