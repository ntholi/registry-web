import { GMAIL_SCOPES } from '@mail/accounts/_lib/scopes';
import { eq } from 'drizzle-orm';
import { google } from 'googleapis';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db, mailAccounts } from '@/core/database';

interface OAuthState {
	returnUrl: string;
	userId: string;
}

function createOAuth2Client() {
	return new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		`${process.env.BETTER_AUTH_URL}/api/auth/gmail`
	);
}

function isRelativePath(url: string): boolean {
	return url.startsWith('/') && !url.startsWith('//');
}

export async function GET(request: NextRequest) {
	const session = await auth();

	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get('code');

	if (!code) {
		return handleRedirectToGoogle(request, session.user.id);
	}

	return handleTokenExchange(request, session.user.id, code);
}

function handleRedirectToGoogle(request: NextRequest, userId: string) {
	const searchParams = request.nextUrl.searchParams;
	const returnUrl = searchParams.get('returnUrl') || '/mail';
	const loginHint = searchParams.get('loginHint');

	const safeReturnUrl = isRelativePath(returnUrl) ? returnUrl : '/mail';

	const state: OAuthState = { returnUrl: safeReturnUrl, userId };
	const oauth2Client = createOAuth2Client();

	const authUrl = oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: [...GMAIL_SCOPES],
		prompt: 'consent',
		state: JSON.stringify(state),
		...(loginHint ? { login_hint: loginHint } : {}),
	});

	return NextResponse.redirect(authUrl);
}

async function handleTokenExchange(
	request: NextRequest,
	userId: string,
	code: string
) {
	const stateParam = request.nextUrl.searchParams.get('state');
	let returnUrl = '/mail';

	if (stateParam) {
		try {
			const state: OAuthState = JSON.parse(stateParam);

			if (state.userId !== userId) {
				return NextResponse.json(
					{ error: 'State mismatch — possible CSRF' },
					{ status: 403 }
				);
			}

			if (isRelativePath(state.returnUrl)) {
				returnUrl = state.returnUrl;
			}
		} catch {
			return NextResponse.json(
				{ error: 'Invalid state parameter' },
				{ status: 400 }
			);
		}
	}

	const oauth2Client = createOAuth2Client();

	try {
		const { tokens } = await oauth2Client.getToken(code);
		oauth2Client.setCredentials(tokens);

		const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
		const { data: userInfo } = await oauth2.userinfo.get();

		if (!userInfo.email) {
			return NextResponse.json(
				{ error: 'Could not retrieve email from Google' },
				{ status: 400 }
			);
		}

		const existing = await db
			.select({ id: mailAccounts.id, userId: mailAccounts.userId })
			.from(mailAccounts)
			.where(eq(mailAccounts.email, userInfo.email))
			.limit(1);

		const account = existing[0];

		if (account && account.userId !== userId) {
			return NextResponse.json(
				{ error: 'This email is already authorized by another user' },
				{ status: 409 }
			);
		}

		const tokenData = {
			accessToken: tokens.access_token ?? null,
			refreshToken: tokens.refresh_token ?? null,
			tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
			scope: tokens.scope ?? GMAIL_SCOPES.join(' '),
			isActive: true,
		};

		if (account) {
			await db
				.update(mailAccounts)
				.set({
					...tokenData,
					displayName: userInfo.name ?? account.userId,
				})
				.where(eq(mailAccounts.id, account.id));
		} else {
			await db.insert(mailAccounts).values({
				userId,
				email: userInfo.email,
				displayName: userInfo.name ?? null,
				...tokenData,
			});
		}

		return NextResponse.redirect(new URL(returnUrl, request.url));
	} catch (error) {
		console.error('Gmail OAuth token exchange failed:', error);
		return NextResponse.json(
			{ error: 'Failed to authenticate with Gmail' },
			{ status: 500 }
		);
	}
}
