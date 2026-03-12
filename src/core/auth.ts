import { listPresetPermissions } from '@auth/permission-presets/_server/repository';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth/minimal';
import { nextCookies } from 'better-auth/next-js';
import { admin, customSession } from 'better-auth/plugins';
import { nanoid } from 'nanoid';
import type { PermissionGrant } from '@/core/auth/permissions';
import { db, schema } from '@/core/database';
import { handlers, auth as legacyAuth, signIn, signOut } from './auth.legacy';

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
			let permissions: PermissionGrant[] = [];
			const presetId =
				'presetId' in user && typeof user.presetId === 'string'
					? user.presetId
					: undefined;

			if (presetId) {
				permissions = await listPresetPermissions(presetId);
			}

			return { user, session, permissions };
		}),
		nextCookies(),
	],
});

export type Session = typeof betterAuthServer.$Infer.Session;

export const auth = legacyAuth;
export { handlers, legacyAuth, signIn, signOut };

export * from './auth/permissions';
