import { getPresetSessionData } from '@auth/permission-presets/_server/repository';
import StudentRepository from '@registry/students/_server/repository';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth/minimal';
import { nextCookies } from 'better-auth/next-js';
import { admin, customSession } from 'better-auth/plugins';
import { nanoid } from 'nanoid';
import { headers } from 'next/headers';
import type { PermissionGrant } from '@/core/auth/permissions';
import { db, schema } from '@/core/database';

type BetterAuthSession = typeof betterAuthServer.$Infer.Session;
type BetterAuthUser = BetterAuthSession['user'];
type SessionExtras = {
	permissions?: PermissionGrant[];
	presetName?: string | null;
};
type SessionUserFields = {
	presetId?: string | null;
	role?: string;
};
type SessionUser = BetterAuthUser & {
	presetId: string | null;
	presetName: string | null;
	role: string;
	stdNo: number | null;
};

const studentRepo = new StudentRepository();

export const betterAuthServer = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: 'pg',
		usePlural: true,
		schema,
	}),
	trustedOrigins: [
		process.env.BETTER_AUTH_URL!,
		...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',').map((origin) =>
			origin.trim()
		) ?? []),
	],
	user: {
		additionalFields: {
			role: {
				type: 'string',
				required: false,
				defaultValue: 'user',
				input: false,
			},
			presetId: {
				type: 'string',
				required: false,
				input: false,
			},
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		freshAge: 60 * 5,
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5,
			strategy: 'compact',
			version: '1',
		},
	},
	account: {
		encryptOAuthTokens: true,
		updateAccountOnSignIn: true,
		accountLinking: {
			enabled: true,
			trustedProviders: ['google'],
		},
	},
	rateLimit: {
		enabled: true,
		storage: 'database',
		window: 60,
		max: 100,
		customRules: {
			'/sign-in/social': { window: 10, max: 3 },
		},
	},
	advanced: {
		useSecureCookies: process.env.NODE_ENV === 'production',
		database: {
			generateId: () => nanoid(),
		},
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			prompt: 'select_account',
		},
	},
	plugins: [
		admin({ defaultRole: 'user' }),
		customSession(async ({ user, session }) => {
			const presetId =
				'presetId' in user && typeof user.presetId === 'string'
					? user.presetId
					: undefined;
			const preset = presetId ? await getPresetSessionData(presetId) : null;

			const permissions = preset?.permissions ?? [];
			const presetName = preset?.name ?? null;

			return {
				user,
				session,
				permissions,
				presetName,
			};
		}),
		nextCookies(),
	],
});

export type Session = {
	expires?: string;
	permissions?: PermissionGrant[];
	session: BetterAuthSession['session'];
	user: SessionUser;
};

export async function auth(): Promise<Session | null> {
	const session = await betterAuthServer.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return null;
	}

	const sessionExtras = session as BetterAuthSession & SessionExtras;
	const user = session.user as BetterAuthUser & SessionUserFields;
	const permissions = Array.isArray(sessionExtras.permissions)
		? sessionExtras.permissions
		: [];
	const stdNo =
		user.role === 'student'
			? await studentRepo.findStdNoByUserId(user.id)
			: null;
	const expiresAt = session.session.expiresAt;

	return {
		...session,
		expires:
			expiresAt instanceof Date
				? expiresAt.toISOString()
				: typeof expiresAt === 'string'
					? expiresAt
					: undefined,
		permissions,
		user: {
			...user,
			presetName:
				typeof sessionExtras.presetName === 'string'
					? sessionExtras.presetName
					: null,
			presetId: typeof user.presetId === 'string' ? user.presetId : null,
			role: typeof user.role === 'string' ? user.role : 'user',
			stdNo,
		},
	};
}

export * from './auth/permissions';
