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
  AcademicUserRoles,
} from './db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

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
  events: {
    async createUser({ user }) {
      const predefinedUser = getPredefinedUser(user?.email);
      if (predefinedUser && user.id) {
        await db
          .update(users)
          .set({ academicRole: predefinedUser.role })
          .where(eq(users.id, user.id));
      }
    },
  },
});

type PredefinedUser = {
  name: string;
  email: string;
  role: AcademicUserRoles;
};

function getPredefinedUser(email?: string | null): PredefinedUser | null {
  if (!email) return null;
  const usersPath = path.resolve(__dirname, '../data/users.json');
  const usersData = fs.readFileSync(usersPath, 'utf-8');
  const usersList = JSON.parse(usersData);
  return (
    usersList.find((user: { email: string }) => user.email === email) || null
  );
}
