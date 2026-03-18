import { and, eq } from 'drizzle-orm';
import { type gmail_v1, google } from 'googleapis';
import { db, mailAccounts } from '@/core/database';

async function fetchActiveAccount(...conditions: Parameters<typeof and>) {
	const [account] = await db
		.select()
		.from(mailAccounts)
		.where(and(...conditions, eq(mailAccounts.isActive, true)))
		.limit(1);

	return account;
}

function buildOAuth2Client(account: typeof mailAccounts.$inferSelect) {
	const oauth2Client = new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		`${process.env.BETTER_AUTH_URL}/api/auth/gmail`
	);

	if (!account.accessToken) {
		throw new Error(`No access token for mail account ${account.email}`);
	}

	oauth2Client.setCredentials({
		access_token: account.accessToken,
		refresh_token: account.refreshToken ?? undefined,
		expiry_date: account.tokenExpiresAt
			? account.tokenExpiresAt.getTime()
			: undefined,
	});

	oauth2Client.on('tokens', async (tokens) => {
		try {
			const updates: Partial<typeof mailAccounts.$inferInsert> = {};

			if (tokens.refresh_token) {
				updates.refreshToken = tokens.refresh_token;
			}
			if (tokens.access_token) {
				updates.accessToken = tokens.access_token;
			}
			if (tokens.expiry_date) {
				updates.tokenExpiresAt = new Date(tokens.expiry_date);
			}

			if (Object.keys(updates).length > 0) {
				await db
					.update(mailAccounts)
					.set(updates)
					.where(eq(mailAccounts.id, account.id));
			}
		} catch (err) {
			console.error(
				`Failed to persist refreshed tokens for ${account.email}:`,
				err
			);
		}
	});

	return oauth2Client;
}

async function markInactive(accountId: string) {
	await db
		.update(mailAccounts)
		.set({ isActive: false })
		.where(eq(mailAccounts.id, accountId));
}

function buildGmailClient(
	account: typeof mailAccounts.$inferSelect
): gmail_v1.Gmail {
	try {
		const auth = buildOAuth2Client(account);
		return google.gmail({ version: 'v1', auth });
	} catch (err) {
		markInactive(account.id).catch(() => {});
		throw err;
	}
}

export async function getGmailClient(
	mailAccountId: string
): Promise<gmail_v1.Gmail> {
	const account = await fetchActiveAccount(eq(mailAccounts.id, mailAccountId));

	if (!account) {
		throw new Error(`Mail account not found: ${mailAccountId}`);
	}

	return buildGmailClient(account);
}

export async function getGmailClientByEmail(
	email: string
): Promise<gmail_v1.Gmail> {
	const account = await fetchActiveAccount(eq(mailAccounts.email, email));

	if (!account) {
		throw new Error(`No active mail account for email: ${email}`);
	}

	return buildGmailClient(account);
}

export async function getPrimaryGmailClient(): Promise<gmail_v1.Gmail> {
	const account = await fetchActiveAccount(eq(mailAccounts.isPrimary, true));

	if (!account) {
		throw new Error('No active primary mail account configured');
	}

	return buildGmailClient(account);
}
