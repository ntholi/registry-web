import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import NextAuth from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import Google from 'next-auth/providers/google';
import {
	accounts,
	db,
	sessions,
	students,
	users,
	verificationTokens,
} from '@/core/database';

export const { handlers, signIn, signOut, auth } = NextAuth({
	providers: [Google],
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens,
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

				if (account?.access_token) {
					session.accessToken = account.access_token;
				}
			}

			return session;
		},
	},
});
