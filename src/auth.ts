import { db } from '@/db';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import NextAuth from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import Google from 'next-auth/providers/google';
import path from 'path';
import {
  accounts,
  sessions,
  students,
  users,
  verificationTokens,
} from './db/schema';

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
    async session({ session, user }) {
      session.user.role = user.role;
      session.user.position = user.position;

      if (user.role === 'student') {
        const student = await db.query.students.findFirst({
          where: eq(students.userId, user.id),
        });

        session.user.stdNo = student?.stdNo;
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

        if (userData && userData.std_no) {
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
