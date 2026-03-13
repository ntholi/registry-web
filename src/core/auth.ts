import { listPresetPermissions } from '@auth/permission-presets/_server/repository';
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
type SessionUser = BetterAuthUser & {
	presetId: string | null;
	role: string;
	position: string | null;
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
			position: {
				type: 'string',
				required: false,
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
			let permissions: PermissionGrant[] = [];
			const presetId =
				'presetId' in user && typeof user.presetId === 'string'
					? user.presetId
					: undefined;

			if (presetId) {
				permissions = await listPresetPermissions(presetId);
			}

			return {
				user,
				session,
				permissions,
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

	const permissions = Array.isArray(session.permissions)
		? session.permissions
		: [];
	const stdNo =
		session.user.role === 'student'
			? await studentRepo.findStdNoByUserId(session.user.id)
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
			...session.user,
			presetId:
				typeof session.user.presetId === 'string'
					? session.user.presetId
					: null,
			role: typeof session.user.role === 'string' ? session.user.role : 'user',
			position:
				typeof session.user.position === 'string'
					? session.user.position
					: null,
			stdNo,
		},
	};
}

export * from './auth/permissions';
