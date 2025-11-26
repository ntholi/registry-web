import fs from 'node:fs';
import path from 'node:path';
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

interface UserData {
	email: string;
	std_no: number | null;
}

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
	events: {
		async createUser({ user }) {
			if (!user || !user.id || !user.email) return;

			try {
				const usersFilePath = path.join(process.cwd(), 'data', 'users.json');
				const usersData = JSON.parse(
					fs.readFileSync(usersFilePath, 'utf8')
				) as UserData[];

				const userData = usersData.find((u) => u.email === user.email);

				if (userData?.std_no) {
					const student = await db.query.students.findFirst({
						where: eq(students.stdNo, userData.std_no),
					});
					if (student) {
						await db.transaction(async (tx) => {
							await tx
								.update(students)
								.set({ userId: user.id })
								.where(eq(students.stdNo, userData.std_no!));

							await tx
								.update(users)
								.set({ role: 'student' })
								.where(eq(users.id, user.id!));
						});
					}
				}
			} catch (error) {
				console.error('Error in createUser event:', error);
			}
		},
	},
});
