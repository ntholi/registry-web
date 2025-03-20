import { db } from '@/db';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import NextAuth from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import Google from 'next-auth/providers/google';
import {
  accounts,
  sessions,
  users,
  verificationTokens,
  students,
} from './db/schema';
import { eq } from 'drizzle-orm';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }) as Adapter,

  callbacks: {
    async session({ session, user }) {
      session.user.role = user.role;

      if (user.role === 'student') {
        const student = await db.query.students.findFirst({
          where: eq(students.userId, user.id),
        });

        session.user.stdNo = student?.stdNo;
        session.user.isDepartmentAdmin = user.isDepartmentAdmin ?? false;
      }
      return session;
    },
  },
});
