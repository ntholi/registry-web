import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import {
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import NextAuth from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import Google from 'next-auth/providers/google';
import { accounts, db, students } from '@/core/database';

const legacyUsers = pgTable('users', {
	id: text('id').primaryKey(),
	name: text('name'),
	email: text('email').unique(),
	emailVerified: timestamp('email_verified', { mode: 'date' }),
	image: text('image'),
});

const legacySessions = pgTable('sessions', {
	sessionToken: text('session_token').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => legacyUsers.id, { onDelete: 'cascade' }),
	expires: timestamp('expires', { mode: 'date' }).notNull(),
});

const legacyVerificationTokens = pgTable(
	'verification_tokens',
	{
		identifier: text('identifier').notNull(),
		token: text('token').notNull(),
		expires: timestamp('expires', { mode: 'date' }).notNull(),
	},
	(table) => ({
		compositePk: primaryKey({
			columns: [table.identifier, table.token],
		}),
	})
);

const legacyAccounts = pgTable(
	'accounts',
	{
		userId: text('user_id')
			.notNull()
			.references(() => legacyUsers.id, { onDelete: 'cascade' }),
		type: text('type').notNull(),
		provider: text('provider').notNull(),
		providerAccountId: text('provider_account_id').notNull(),
		refresh_token: text('refresh_token'),
		access_token: text('access_token'),
		expires_at: integer('expires_at'),
		token_type: text('token_type'),
		scope: text('scope'),
		id_token: text('id_token'),
		session_state: text('session_state'),
	},
	(table) => ({
		compositePk: primaryKey({
			columns: [table.provider, table.providerAccountId],
		}),
	})
);

export const { handlers, signIn, signOut, auth } = NextAuth({
	providers: [Google],
	adapter: DrizzleAdapter(db, {
		usersTable: legacyUsers,
		accountsTable: legacyAccounts,
		sessionsTable: legacySessions,
		verificationTokensTable: legacyVerificationTokens,
	}) as Adapter,

	callbacks: {
		async session({ session, user, trigger }) {
			session.user.role = user.role;
			session.user.position = user.position;
			session.user.lmsUserId = user.lmsUserId;
			session.user.lmsToken = user.lmsToken;

			if (user.role === 'student') {
				const student = await db.query.students.findFirst({
					where: eq(students.userId, user.id),
				});

				session.user.stdNo = student?.stdNo;
			}

			if (trigger === 'update' || !session.accessToken) {
				const account = await db.query.accounts.findFirst({
					where: eq(accounts.userId, user.id),
				});

				if (account?.accessToken) {
					session.accessToken = account.accessToken;
				}
			}

			return session;
		},
	},
});
